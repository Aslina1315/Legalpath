/**
 * AI Module 06: AI Evidence Analyzer
 *
 * In Gemini mode: Inspects user-uploaded legal documents (PDF, PNG, JPEG, WebP)
 * using Gemini multimodal capabilities.
 *
 * In Groq mode: Analyzes document text context and metadata using backend Groq.
 *
 * Enforces strict MIME and file size validation.
 */

import { getGenerativeModel } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { FALLBACK_MODEL_NAME, STRUCTURED_MODEL } from './models';
import { PROMPTS } from './prompts';
import { EvidenceAnalysisZodSchema, EVIDENCE_ANALYSIS_FIREBASE_SCHEMA } from './schemas';
import { buildMultimodalParts, validateInlineFileSize } from './multimodalHelper';
import {
  callSecureBackendGenerate,
  callSecureBackendFallback,
  canUseSecureBackendFallback,
  executeWithGemini429Handling,
  isGroqPrimary,
  isTemporaryProviderError,
} from './structuredOutputHelper';
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

  // ─── GROQ PRIMARY MODE ─────────────────────────────────────────────────────
  if (isGroqPrimary()) {
    console.log('[AI] primary=groq');
    console.log('[AI] evidence-analysis: Groq primary (zero Gemini calls)');

    const backendResponse = await callSecureBackendGenerate<{
      status: string;
      text?: string;
      model?: string;
    }>({
      prompt: textInstruction,
      systemPrompt:
        'You are a careful legal evidence-review assistant. Return valid JSON only matching the expected evidence schema.',
      capability: 'multimodal',
    });

    if (backendResponse.status !== 'ok' || !backendResponse.text) {
      throw new Error('AI service is temporarily busy. Please try again shortly.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(backendResponse.text);
    } catch {
      throw new Error(`Invalid JSON returned from Evidence Analyzer: ${backendResponse.text.slice(0, 200)}`);
    }

    const validated = EvidenceAnalysisZodSchema.parse(parsed);

    return {
      data: validated,
      model: backendResponse.model || 'qwen/qwen3.8-27b',
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── GEMINI MODE ───────────────────────────────────────────────────────────
  console.log('[AI] primary=gemini');
  console.log('[AI] evidence-analysis: Gemini multimodal');

  const parts = buildMultimodalParts([
    { type: 'text', text: textInstruction },
    { type: 'file', mimeType: file.mimeType, data: file.base64Data },
  ]);

  const ai = getAIInstance();
  const primaryModel = getGenerativeModel(ai, {
    model: STRUCTURED_MODEL.model,
    generationConfig: {
      ...STRUCTURED_MODEL.generationConfig,
      responseSchema: EVIDENCE_ANALYSIS_FIREBASE_SCHEMA,
    },
    safetySettings: STRUCTURED_MODEL.safetySettings,
  });

  try {
    const result = await executeWithGemini429Handling(
      () => primaryModel.generateContent(parts),
      undefined
    );
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
  } catch (error) {
    if (isTemporaryProviderError(error) && canUseSecureBackendFallback('multimodal')) {
      try {
        const fallback = await callSecureBackendFallback<{ status: string; text?: string; model?: string }>({
          prompt: textInstruction,
          systemPrompt:
            'You are a careful legal evidence-review assistant. Return valid JSON only matching the expected evidence schema.',
          capability: 'multimodal',
        });

        if (fallback.status === 'ok' && fallback.text) {
          try {
            const parsed = JSON.parse(fallback.text) as EvidenceAnalysisResult;
            const normalized = EvidenceAnalysisZodSchema.parse(parsed);
            return {
              data: normalized,
              model: fallback.model || 'qwen/qwen3.8-27b',
              generatedAt: new Date().toISOString(),
            };
          } catch {
            return {
              data: {
                documentType: 'UNKNOWN',
                dates: [],
                amounts: [],
                peopleOrEntities: [],
                importantStatements: [fallback.text.slice(0, 220)],
                relevantClauses: [],
                evidenceItems: [],
                confidence: 0.5,
                uncertainItems: ['Evidence review was temporarily unavailable during the secure fallback.'],
              },
              model: fallback.model || 'qwen/qwen3.8-27b',
              generatedAt: new Date().toISOString(),
            };
          }
        }
      } catch {
        // Fall through to error
      }
    }

    throw new Error('AI service is temporarily busy. Please try again shortly.');
  }
}
