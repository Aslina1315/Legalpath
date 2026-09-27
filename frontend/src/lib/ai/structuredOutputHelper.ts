/**
 * Structured output helper for Firebase AI Logic.
 * Enables typed JSON responses from Gemini using responseSchema.
 */

import { getGenerativeModel } from 'firebase/ai';
import type { Schema } from 'firebase/ai';
import { getAIInstance } from './aiClient';
import { FALLBACK_MODEL, FALLBACK_MODEL_NAME, PRIMARY_MODEL_NAME, STRUCTURED_MODEL } from './models';
import type { AIStructuredResponse } from '@/types/ai';
import type { ZodSchema } from 'zod';

const TEMPORARY_PROVIDER_PATTERNS = [
  '429',
  'resource_exhausted',
  'quota',
  'rate limit',
  'generateRequestsPerMinute',
  'high demand',
  'temporarily busy',
  'temporarily unavailable',
  'temporary service unavailable',
  'unavailable',
  '503',
  '500',
  'too many requests',
  'overloaded',
  'backend error',
];

const PERMANENT_CONFIGURATION_PATTERNS = [
  'invalid api key',
  'invalid-api-key',
  'configuration-not-found',
  'auth/',
  'permission denied',
  'forbidden',
  'malformed request',
  'invalid request',
  'invalid model configuration',
  'unsupported schema',
  'unsupported response schema',
  'invalid argument',
  'not configured',
  'authentication',
  'credentials',
  'unauthorized',
];

export function normalizeGeminiError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return String(error);
}

export function is429Error(error: unknown): boolean {
  const msg = normalizeGeminiError(error).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('generaterequestsperminute') ||
    msg.includes('too many requests')
  );
}

export function isTemporaryProviderError(error: unknown): boolean {
  const msg = normalizeGeminiError(error).toLowerCase();
  if (is429Error(error)) {
    return true;
  }

  return TEMPORARY_PROVIDER_PATTERNS.some((pattern) => msg.includes(pattern.toLowerCase()));
}

export function isPermanentConfigurationError(error: unknown): boolean {
  const msg = normalizeGeminiError(error).toLowerCase();
  if (msg.includes('firebase: error (auth/invalid-api-key)')) {
    return true;
  }

  return PERMANENT_CONFIGURATION_PATTERNS.some((pattern) => msg.includes(pattern.toLowerCase()));
}

export function extractRetryDelayMs(error: unknown): number {
  if (!error) return 2500;
  const msg = normalizeGeminiError(error);
  const match = msg.match(/retry (?:after|in) ([\d.]+)\s*s/i);
  if (match && match[1]) {
    const sec = parseFloat(match[1]);
    if (!isNaN(sec) && sec > 0) return Math.min(Math.round(sec * 1000), 5000);
  }
  return 2500;
}

const TEMPORARY_RATE_LIMIT_MESSAGE = 'AI is temporarily at its request limit. Please retry shortly.';

export function isDevelopmentForcedFallbackEnabled(): boolean {
  const envValue =
    (typeof process !== 'undefined' && process.env)
      ? (process.env.NEXT_PUBLIC_AI_FALLBACK_TEST_MODE ?? process.env.AI_FALLBACK_TEST_MODE ?? '').trim().toLowerCase()
      : '';

  return envValue === 'true' && process.env.NODE_ENV !== 'production';
}

export function shouldForceGeminiTemporaryFailure(): boolean {
  return isDevelopmentForcedFallbackEnabled();
}

export function canUseSecureBackendFallback(capability: 'structured' | 'grounded' | 'multimodal' = 'structured'): boolean {
  return capability === 'structured' || capability === 'grounded' || capability === 'multimodal';
}

export async function callSecureBackendFallback<T>(payload: {
  prompt: string;
  systemPrompt?: string;
  system_prompt?: string;
  model?: string;
  capability?: 'structured' | 'grounded' | 'multimodal';
}): Promise<T> {
  const response = await fetch('/api/backend/ai/fallback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      system_prompt: payload.system_prompt ?? payload.systemPrompt ?? undefined,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    detail?: { message?: string; code?: string; provider?: string };
    message?: string;
    status?: string;
  };

  if (!response.ok) {
    const message =
      data?.detail?.message ||
      data?.message ||
      'AI service is temporarily busy. Please try again shortly.';
    throw new Error(message);
  }

  return data;
}

export async function executeWithGeminiFallback<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  temporaryFailureMessage = 'AI service is temporarily busy. Please try again shortly.'
): Promise<T> {
  try {
    return await primaryOperation();
  } catch (primaryError) {
    if (!isTemporaryProviderError(primaryError) || isPermanentConfigurationError(primaryError)) {
      throw primaryError;
    }

    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      if (isTemporaryProviderError(fallbackError)) {
        throw new Error(temporaryFailureMessage);
      }
      throw fallbackError;
    }
  }
}

interface StructuredGenerationResult<T> {
  data: T;
  model: string;
  generatedAt: string;
  promptTokens?: number;
  candidateTokens?: number;
  response: { response: { text: () => string; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } } };
}

/**
 * Backward-compatible helper for old 429-specific call sites.
 * Allows at-most-one retry, but no fallback recursion.
 */
export async function executeWithGemini429Handling<T>(
  operation: () => Promise<T>,
  fallbackOperation?: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (firstError) {
    if (!is429Error(firstError) && !fallbackOperation) {
      throw firstError;
    }

    if (fallbackOperation && isTemporaryProviderError(firstError) && !isPermanentConfigurationError(firstError)) {
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        if (isTemporaryProviderError(fallbackError)) {
          throw new Error('AI service is temporarily busy. Please try again shortly.');
        }
        throw fallbackError;
      }
    }

    if (!is429Error(firstError)) {
      throw firstError;
    }

    const delay = extractRetryDelayMs(firstError);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      return await operation();
    } catch (secondError) {
      if (fallbackOperation && isTemporaryProviderError(secondError) && !isPermanentConfigurationError(secondError)) {
        try {
          return await fallbackOperation();
        } catch (fallbackSecondError) {
          if (isTemporaryProviderError(fallbackSecondError)) {
            throw new Error('AI service is temporarily busy. Please try again shortly.');
          }
          throw fallbackSecondError;
        }
      }

      if (is429Error(secondError)) {
        throw new Error(TEMPORARY_RATE_LIMIT_MESSAGE);
      }
      throw secondError;
    }
  }
}

function buildStructuredModelWithFallback(firebaseSchema: Schema) {
  const ai = getAIInstance();

  const primaryModel = getGenerativeModel(ai, {
    model: STRUCTURED_MODEL.model,
    generationConfig: {
      ...STRUCTURED_MODEL.generationConfig,
      responseSchema: firebaseSchema,
    },
    safetySettings: STRUCTURED_MODEL.safetySettings,
  });

  const fallbackModel = getGenerativeModel(ai, {
    model: FALLBACK_MODEL_NAME,
    generationConfig: {
      ...FALLBACK_MODEL.generationConfig,
      responseSchema: firebaseSchema,
    },
    safetySettings: FALLBACK_MODEL.safetySettings,
  });

  return {
    primaryOperation: () => primaryModel.generateContent,
    fallbackOperation: () => fallbackModel.generateContent,
  };
}

function extractStructuredJsonCandidate(raw: unknown): unknown {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      return JSON.parse(stripped);
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return raw;
        }
      }
      return raw;
    }
  }

  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const record = raw as Record<string, unknown>;

  if (Array.isArray(record.choices) && record.choices.length > 0) {
    const choice = record.choices[0] as Record<string, unknown>;
    const choiceMessage = choice.message as Record<string, unknown> | undefined;
    const content = choiceMessage?.content ?? choice.content;

    if (typeof content === 'string') {
      return extractStructuredJsonCandidate(content);
    }

    if (Array.isArray(content)) {
      const text = content
        .map((part) =>
          typeof part === 'object' && part && 'text' in part ? String((part as Record<string, unknown>).text ?? '') : ''
        )
        .join('');
      if (text) return extractStructuredJsonCandidate(text);
    }
  }

  if (Array.isArray(record.candidates) && record.candidates.length > 0) {
    const candidate = record.candidates[0] as Record<string, unknown>;
    const content = candidate.content as Record<string, unknown> | undefined;
    const parts = Array.isArray(content?.parts) ? (content?.parts as Record<string, unknown>[]) : [];
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('');
    if (text) return extractStructuredJsonCandidate(text);
  }

  for (const key of ['result', 'data', 'analysis', 'output', 'response', 'payload']) {
    if (key in record) {
      const candidate = record[key];
      if (candidate && typeof candidate === 'object') {
        return extractStructuredJsonCandidate(candidate);
      }
    }
  }

  return raw;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (typeof entry === 'object' && entry && 'text' in entry) return String((entry as Record<string, unknown>).text ?? '');
        if (typeof entry === 'object' && entry && 'description' in entry) return String((entry as Record<string, unknown>).description ?? '');
        return '';
      })
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }

  return [];
}

function normalizeUrgencyLevel(value: unknown): 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' {
  const normalized = String(value ?? 'UNKNOWN').trim().toUpperCase();
  if (normalized === 'HIGH' || normalized === 'MEDIUM' || normalized === 'LOW' || normalized === 'UNKNOWN') {
    return normalized as 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  }
  return 'UNKNOWN';
}

function normalizeTimelineEntry(entry: Record<string, unknown>) {
  const description =
    typeof entry.description === 'string'
      ? entry.description
      : typeof entry.details === 'string'
        ? entry.details
        : typeof entry.text === 'string'
          ? entry.text
          : typeof entry.summary === 'string'
            ? entry.summary
            : '';

  const confidenceValue =
    typeof entry.confidence === 'number'
      ? entry.confidence
      : typeof entry.score === 'number'
        ? entry.score
        : typeof entry.confidenceScore === 'number'
          ? entry.confidenceScore
          : 0.5;

  return {
    description,
    date: entry.date ?? entry.eventDate ?? entry.when ?? null,
    approximateDate: entry.approximateDate ?? entry.approximate_date ?? null,
    confidence: confidenceValue,
  };
}

export function normalizeStructuredPayload<T extends Record<string, unknown>>(raw: unknown): T {
  const extracted = extractStructuredJsonCandidate(raw);
  const source = (extracted && typeof extracted === 'object' ? extracted : {}) as Record<string, unknown>;
  const unwrapped =
    typeof source.result === 'object' && source.result
      ? (source.result as Record<string, unknown>)
      : typeof source.data === 'object' && source.data
        ? (source.data as Record<string, unknown>)
        : typeof source.output === 'object' && source.output
          ? (source.output as Record<string, unknown>)
          : source;

  const summary =
    typeof unwrapped.summary === 'string'
      ? unwrapped.summary
      : typeof unwrapped.overview === 'string'
        ? unwrapped.overview
        : typeof unwrapped.description === 'string'
          ? unwrapped.description
          : '';

  const structuredFacts = Array.isArray(unwrapped.structuredFacts)
    ? unwrapped.structuredFacts
    : Array.isArray(unwrapped.facts)
      ? unwrapped.facts
      : Array.isArray(unwrapped.keyFacts)
        ? unwrapped.keyFacts
        : [];

  const normalizedFacts = structuredFacts.map((fact) => {
    if (typeof fact === 'string') {
      return { text: fact, confidence: 0.5 };
    }
    if (fact && typeof fact === 'object') {
      const record = fact as Record<string, unknown>;
      return {
        text:
          typeof record.text === 'string'
            ? record.text
            : typeof record.fact === 'string'
              ? record.fact
              : typeof record.description === 'string'
                ? record.description
                : String(record),
        confidence:
          typeof record.confidence === 'number'
            ? record.confidence
            : typeof record.score === 'number'
              ? record.score
              : 0.5,
        category: typeof record.category === 'string' ? record.category : undefined,
      };
    }
    return { text: String(fact), confidence: 0.5 };
  });

  const timelineSource = Array.isArray(unwrapped.timeline)
    ? unwrapped.timeline
    : Array.isArray(unwrapped.events)
      ? unwrapped.events
      : [];

  const timeline = timelineSource.map((entry) => {
    if (entry && typeof entry === 'object') {
      return normalizeTimelineEntry(entry as Record<string, unknown>);
    }
    return { description: String(entry), date: null, approximateDate: null, confidence: 0.5 };
  });

  const normalized = {
    summary,
    structuredFacts: normalizedFacts,
    entities: Array.isArray(unwrapped.entities) ? unwrapped.entities : [],
    timeline,
    domain:
      typeof unwrapped.domain === 'string'
        ? unwrapped.domain
        : typeof unwrapped.legalDomain === 'string'
          ? unwrapped.legalDomain
          : '',
    subDomain:
      typeof unwrapped.subDomain === 'string'
        ? unwrapped.subDomain
        : typeof unwrapped.sub_domain === 'string'
          ? unwrapped.sub_domain
          : undefined,
    domainConfidence:
      typeof unwrapped.domainConfidence === 'number'
        ? unwrapped.domainConfidence
        : typeof unwrapped.domain_confidence === 'number'
          ? unwrapped.domain_confidence
          : 0.5,
    jurisdiction:
      typeof unwrapped.jurisdiction === 'string'
        ? unwrapped.jurisdiction
        : typeof unwrapped.detectedJurisdiction === 'string'
          ? unwrapped.detectedJurisdiction
          : null,
    jurisdictionConfidence:
      typeof unwrapped.jurisdictionConfidence === 'number'
        ? unwrapped.jurisdictionConfidence
        : typeof unwrapped.jurisdiction_confidence === 'number'
          ? unwrapped.jurisdiction_confidence
          : 0.5,
    missingInformation: normalizeStringArray(
      unwrapped.missingInformation ?? unwrapped.missing_information ?? unwrapped.missingInfo ?? unwrapped.questions
    ),
    urgencySignals: normalizeStringArray(
      unwrapped.urgencySignals ?? unwrapped.urgency_signals ?? unwrapped.urgencyReasons ?? unwrapped.urgency_reasons
    ),
    urgencyLevel: normalizeUrgencyLevel(unwrapped.urgencyLevel ?? unwrapped.urgency_level ?? unwrapped.level),
    initialEvidenceGaps: normalizeStringArray(
      unwrapped.initialEvidenceGaps ??
        unwrapped.evidenceGaps ??
        unwrapped.evidence_gaps ??
        unwrapped.evidenceMissing ??
        unwrapped.evidence_missing
    ),
  } as unknown as T;

  return normalized;
}

/**
 * Generates a structured JSON response from Gemini.
 * Validates the response against the provided Zod schema.
 *
 * @param prompt - The prompt to send
 * @param firebaseSchema - Firebase AI responseSchema for the model
 * @param zodSchema - Zod schema for client-side validation
 * @returns Validated, typed response
 */
export async function generateStructured<T>(
  prompt: string,
  firebaseSchema: Schema,
  zodSchema: ZodSchema<T>
): Promise<AIStructuredResponse<T>> {
  const ai = getAIInstance();
  const primaryModel = getGenerativeModel(ai, {
    model: STRUCTURED_MODEL.model,
    generationConfig: {
      ...STRUCTURED_MODEL.generationConfig,
      responseSchema: firebaseSchema,
    },
    safetySettings: STRUCTURED_MODEL.safetySettings,
  });

  const fallbackModel = getGenerativeModel(ai, {
    model: FALLBACK_MODEL_NAME,
    generationConfig: {
      ...FALLBACK_MODEL.generationConfig,
      responseSchema: firebaseSchema,
    },
    safetySettings: FALLBACK_MODEL.safetySettings,
  });

  const parseAndValidateStructuredResponse = (responseText: string): T => {
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      throw new Error(`AI returned invalid JSON. Raw response: ${responseText.slice(0, 200)}`);
    }

    const candidates: unknown[] = [
      parsedData,
      normalizeStructuredPayload(parsedData as Record<string, unknown>) as T,
    ];
    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        return zodSchema.parse(candidate);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('AI response validation failed.');
  };

  let selectedModelName: string = STRUCTURED_MODEL.model;
  const result = await executeWithGeminiFallback<Awaited<ReturnType<typeof primaryModel.generateContent>>>(
    async () => {
      if (shouldForceGeminiTemporaryFailure()) {
        throw new Error('503 UNAVAILABLE: temporary service unavailable');
      }

      const response = await primaryModel.generateContent(prompt);
      const responseText = response.response.text();
      parseAndValidateStructuredResponse(responseText);
      selectedModelName = STRUCTURED_MODEL.model;
      return response;
    },
    async () => {
      const backendResponse = await callSecureBackendFallback<{
        status: string;
        message: string;
        provider?: string;
        model?: string;
        text?: string;
      }>({
        prompt,
        systemPrompt:
          'You are a careful legal assistance model. Return valid JSON only and respect the task instructions exactly.',
      });

      if (backendResponse.status !== 'ok' || !backendResponse.text) {
        throw new Error('AI service is temporarily busy. Please try again shortly.');
      }

      parseAndValidateStructuredResponse(backendResponse.text);
      selectedModelName = backendResponse.model || 'qwen/qwen3.8-27b';
      return {
        response: {
          text: () => backendResponse.text || '',
          usageMetadata: {},
        },
      } as unknown as Awaited<ReturnType<typeof primaryModel.generateContent>>;
    }
  );

  const responseText = result.response.text();
  const validated = parseAndValidateStructuredResponse(responseText);

  return {
    data: validated,
    model: selectedModelName,
    generatedAt: new Date().toISOString(),
    promptTokens: result.response.usageMetadata?.promptTokenCount,
    candidateTokens: result.response.usageMetadata?.candidatesTokenCount,
  };
}

