/**
 * Multimodal helper — prepares content parts for Gemini multimodal requests.
 *
 * CURRENT STATUS: Architecture in place, not wired to any UI yet.
 * Future: Support file uploads (images, PDFs) for evidence analysis.
 */

import type { Part, TextPart, InlineDataPart } from 'firebase/ai';

export interface MultimodalTextPart {
  type: 'text';
  text: string;
}

export interface MultimodalFilePart {
  type: 'file';
  mimeType: string;
  data: string; // base64-encoded
}

export type MultimodalInput = MultimodalTextPart | MultimodalFilePart;

/**
 * Converts application-level multimodal inputs to Firebase AI Part array.
 * Future: will handle larger files via Firebase Storage references.
 */
export function buildMultimodalParts(inputs: MultimodalInput[]): Part[] {
  return inputs.map((input): Part => {
    if (input.type === 'text') {
      const part: TextPart = { text: input.text };
      return part;
    }

    // Inline data — suitable for small files (< 20MB)
    const part: InlineDataPart = {
      inlineData: {
        mimeType: input.mimeType,
        data: input.data,
      },
    };
    return part;
  });
}

/**
 * Validates that a file is within safe size limits for inline data.
 * Future: larger files should use Firebase Storage.
 */
export function validateInlineFileSize(fileSizeBytes: number): void {
  const MAX_INLINE_BYTES = 20 * 1024 * 1024; // 20 MB
  if (fileSizeBytes > MAX_INLINE_BYTES) {
    throw new Error(
      `File size (${Math.round(fileSizeBytes / 1024 / 1024)}MB) exceeds the 20MB inline limit. ` +
      `Upload larger files via Firebase Storage (not yet implemented).`
    );
  }
}
