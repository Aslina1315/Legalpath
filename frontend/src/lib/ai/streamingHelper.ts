/**
 * Streaming helper for Firebase AI Logic.
 * Wraps generateContentStream with typed callbacks and error handling.
 *
 * IMPORTANT: This helper is ready but not yet wired to any UI.
 * Streaming UI will be implemented in a future stage.
 */

import { getGenerativeModel } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { DEFAULT_MODEL } from './models';
import type { AIStreamChunk } from '@/types/ai';

export type StreamChunkCallback = (chunk: AIStreamChunk) => void;
export type StreamCompleteCallback = (fullText: string) => void;
export type StreamErrorCallback = (error: Error) => void;

export interface StreamOptions {
  onChunk: StreamChunkCallback;
  onComplete?: StreamCompleteCallback;
  onError?: StreamErrorCallback;
  abortSignal?: AbortSignal;
}

/**
 * Streams a text generation response from Gemini.
 * Calls onChunk for each text delta, onComplete when done.
 */
export async function streamGenerateContent(
  prompt: string,
  options: StreamOptions
): Promise<void> {
  const ai = getAIInstance();
  const model = getGenerativeModel(ai, {
    model: DEFAULT_MODEL.model,
    generationConfig: DEFAULT_MODEL.generationConfig,
    safetySettings: DEFAULT_MODEL.safetySettings,
  });

  let fullText = '';

  try {
    const streamResult = await model.generateContentStream(prompt);

    for await (const chunk of streamResult.stream) {
      if (options.abortSignal?.aborted) {
        break;
      }

      const chunkText = chunk.text();
      fullText += chunkText;

      options.onChunk({
        text: chunkText,
        isComplete: false,
      });
    }

    options.onChunk({ text: '', isComplete: true });
    options.onComplete?.(fullText);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options.onChunk({ text: '', isComplete: true, error: err.message });
    options.onError?.(err);
  }
}
