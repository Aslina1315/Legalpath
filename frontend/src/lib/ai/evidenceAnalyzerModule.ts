/**
 * AI Module 06: AI Evidence Analyzer (Multimodal)
 *
 * Inspects user-uploaded legal documents (PDF, PNG, JPEG, WebP)
 * using Gemini multimodal capabilities and extracts verifiable facts,
 * clauses, amounts, parties, and evidentiary weight.
 *
 * Enforces strict MIME and file size validation.
 */

import { getGenerativeModel } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { STRUCTURED_MODEL } from './models';
import { PROMPTS } from './prompts';
import { EvidenceAnalysisZodSchema, EVIDENCE_ANALYSIS_FIREBASE_SCHEMA } from './schemas';
import { buildMultimodalParts, validateInlineFileSize } from './multimodalHelper';
import type { EvidenceAnalysisResult } from '@/types/ai';
import type { AIStructuredResponse } from '@/types/ai';

export const ALLOWED_EVIDENCE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AllowedMimeType = typeof ALLOWED_EVIDENCE_MIME_TYPES[number];

export const MAX_EVIDENCE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadedEvidenceFile {
  name: string;
  mimeType: string;
  base64Data: string;
  sizeBytes: number;
  file?: File;
  analysisResult?: EvidenceAnalysisResult;
}

export function validateEvidenceFile(file: UploadedEvidenceFile | File): void {
  const mimeType = 'type' in file ? file.type : file.mimeType;
  const sizeBytes = 'size' in file ? file.size : file.sizeBytes;

  if (!mimeType || !ALLOWED_EVIDENCE_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    throw new Error(
      `Unsupported file format: "${mimeType}". Allowed formats: PDF, PNG, JPEG, WebP.`
    );
  }

  if (sizeBytes > MAX_EVIDENCE_SIZE_BYTES) {
    throw new Error(
      `File size (${Math.round(sizeBytes / 1024 / 1024)}MB) exceeds maximum limit of 10MB.`
    );
  }

  validateInlineFileSize(sizeBytes);
}

export async function runEvidenceAnalysis(
  fileInput: UploadedEvidenceFile | File,
  caseNarrative?: string
): Promise<AIStructuredResponse<EvidenceAnalysisResult>> {
  validateEvidenceFile(fileInput);

  let file: UploadedEvidenceFile;
  if ('base64Data' in fileInput) {
    file = fileInput;
  } else {
    let base64Data = '';
    const duckFile = fileInput as unknown as { arrayBuffer?: () => Promise<ArrayBuffer>; text?: () => Promise<string> };
    if (typeof duckFile.arrayBuffer === 'function') {
      const arrayBuffer = await duckFile.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else if (typeof duckFile.text === 'function') {
      const text = await duckFile.text();
      base64Data = Buffer.from(text).toString('base64');
    } else {
      base64Data = Buffer.from(String(fileInput)).toString('base64');
    }
    file = {
      name: fileInput.name,
      mimeType: fileInput.type,
      base64Data,
      sizeBytes: fileInput.size,
      file: fileInput,
    };
  }

  const textInstruction = `${PROMPTS.EVIDENCE_ANALYSIS}

---
<untrusted_data>
UPLOADED FILE METADATA:
- File name: ${file.name}
- MIME type: ${file.mimeType}
- Size: ${Math.round(file.sizeBytes / 1024)} KB

CASE NARRATIVE CONTEXT (for relevance cross-reference only; do not assume facts from narrative if not in document):
${caseNarrative ? caseNarrative.trim().slice(0, 1000) : 'No narrative provided.'}
</untrusted_data>
---`;

  const parts = buildMultimodalParts([
    { type: 'text', text: textInstruction },
    { type: 'file', mimeType: file.mimeType, data: file.base64Data },
  ]);

  const ai = getAIInstance();
  const model = getGenerativeModel(ai, {
    model: STRUCTURED_MODEL.model,
    generationConfig: {
      ...STRUCTURED_MODEL.generationConfig,
      responseSchema: EVIDENCE_ANALYSIS_FIREBASE_SCHEMA,
    },
    safetySettings: STRUCTURED_MODEL.safetySettings,
  });

  const result = await model.generateContent(parts);
  const responseText = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON returned from Evidence Analyzer: ${responseText.slice(0, 200)}`);
  }

  const validated = EvidenceAnalysisZodSchema.parse(parsed);

  return {
    data: validated,
    model: STRUCTURED_MODEL.model,
    generatedAt: new Date().toISOString(),
    promptTokens: result.response.usageMetadata?.promptTokenCount,
    candidateTokens: result.response.usageMetadata?.candidatesTokenCount,
  };
}
