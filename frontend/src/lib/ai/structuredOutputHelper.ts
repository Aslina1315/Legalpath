/**
 * Structured output helper for Firebase AI Logic & Groq Backend Provider.
 * Enables typed JSON responses with strict Zod validation and provider routing.
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

import { classifyAIError, sanitizeUserFacingErrorMessage } from './errorClassification';

export interface BackendAIConfig {
  status: string;
  primary_provider: 'gemini' | 'groq';
  groq_only: boolean;
  model: string;
  has_groq_key: boolean;
}

let cachedBackendConfig: BackendAIConfig | null = null;

export function isGroqPrimary(): boolean {
  if (cachedBackendConfig) {
    return cachedBackendConfig.primary_provider === 'groq';
  }
  const envPrimary = (
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AI_PRIMARY_PROVIDER) ||
    'groq'
  ).trim().toLowerCase();
  return envPrimary === 'groq';
}

export function isGroqOnly(): boolean {
  if (cachedBackendConfig) {
    return cachedBackendConfig.groq_only;
  }
  const envGroqOnly = (
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AI_GROQ_ONLY) ||
    'false'
  ).trim().toLowerCase();
  return envGroqOnly === 'true';
}

export async function fetchBackendAIConfig(): Promise<BackendAIConfig | null> {
  if (cachedBackendConfig) return cachedBackendConfig;
  try {
    const res = await fetch('/api/backend/ai/config', { method: 'GET' });
    if (res.ok) {
      const data = (await res.json()) as BackendAIConfig;
      cachedBackendConfig = data;
      return data;
    }
  } catch {
    // Graceful offline fallback
  }
  return null;
}

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

export async function callSecureBackendGenerate<T>(payload: {
  prompt: string;
  systemPrompt?: string;
  system_prompt?: string;
  model?: string;
  capability?: 'structured' | 'grounded' | 'multimodal';
}): Promise<T> {
  const response = await fetch('/api/backend/ai/generate', {
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
    code?: string;
    rate_limited?: boolean;
    retry_after?: number;
  };

  if (response.status === 429 || data?.code === 'GROQ_RATE_LIMITED' || data?.rate_limited) {
    console.warn('[AI] provider=groq\n[AI] error=429\n[AI] rate_limited=true');
    throw new Error('AI is temporarily at its request limit. Please wait a moment and retry.');
  }

  if (!response.ok) {
    const message =
      data?.detail?.message ||
      data?.message ||
      'AI service is temporarily busy. Please try again shortly.';
    throw new Error(message);
  }

  return data;
}

export async function callSecureBackendFallback<T>(payload: {
  prompt: string;
  systemPrompt?: string;
  system_prompt?: string;
  model?: string;
  capability?: 'structured' | 'grounded' | 'multimodal';
}): Promise<T> {
  return callSecureBackendGenerate<T>(payload);
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

/**
 * Backward-compatible helper for old 429-specific call sites.
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

/**
 * Recursively converts all object keys from snake_case to camelCase.
 * Handles nested objects and arrays.
 * Groq models sometimes return snake_case keys even when prompted for camelCase.
 * This is candidate[2] in parseAndValidateStructuredResponse — a universal fallback.
 */
function camelCaseify(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelCaseify);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Convert snake_case → camelCase (handles multi-word: evidence_gaps → evidenceGaps)
      const camel = k.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
      result[camel] = camelCaseify(v);
    }
    return result;
  }
  return value;
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

function normalizeEntityRole(role: unknown): 'CLAIMANT' | 'RESPONDENT' | 'WITNESS' | 'THIRD_PARTY' | 'INSTITUTION' | 'OTHER' {
  const normalized = String(role ?? 'OTHER').trim().toUpperCase();
  if (normalized === 'CLAIMANT' || normalized === 'RESPONDENT' || normalized === 'WITNESS' || normalized === 'THIRD_PARTY' || normalized === 'INSTITUTION' || normalized === 'OTHER') {
    return normalized as 'CLAIMANT' | 'RESPONDENT' | 'WITNESS' | 'THIRD_PARTY' | 'INSTITUTION' | 'OTHER';
  }
  if (normalized.includes('TENANT') || normalized.includes('PLAINTIFF') || normalized.includes('CLIENT') || normalized.includes('USER') || normalized.includes('VICTIM')) {
    return 'CLAIMANT';
  }
  if (normalized.includes('LANDLORD') || normalized.includes('DEFENDANT') || normalized.includes('EMPLOYER') || normalized.includes('COMPANY') || normalized.includes('OPPOSING')) {
    return 'RESPONDENT';
  }
  return 'OTHER';
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
  const entitiesSource = Array.isArray(unwrapped.entities) ? unwrapped.entities : [];
  const normalizedEntities = entitiesSource.map((ent) => {
    if (ent && typeof ent === 'object') {
      const record = ent as Record<string, unknown>;
      return {
        name: typeof record.name === 'string' ? record.name : 'Unknown Entity',
        role: normalizeEntityRole(record.role),
        notes: typeof record.notes === 'string' ? record.notes : undefined,
      };
    }
    return {
      name: String(ent),
      role: 'OTHER' as const,
    };
  });

  const normalized = {
    summary,
    structuredFacts: normalizedFacts,
    entities: normalizedEntities,
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
          : null, // Always null (never undefined) — satisfies z.string().nullable()
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
 * Generates a structured JSON response from configured AI provider (Groq or Gemini).
 * Validates the response strictly against the provided Zod schema.
 *
 * @param prompt - The prompt to send
 * @param firebaseSchema - Firebase AI responseSchema for Gemini (used in Gemini mode)
 * @param zodSchema - Zod schema for validation
 * @returns Validated, typed response
 */
export async function generateStructured<T>(
  prompt: string,
  firebaseSchema: Schema,
  zodSchema: ZodSchema<T>
): Promise<AIStructuredResponse<T>> {
  const parseAndValidateStructuredResponse = (responseText: string): T => {
    // Pre-pass: strip markdown code fences (e.g. ```json\n{...}\n```) before parsing.
    // Some Groq models return JSON wrapped in fences even when instructed not to.
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      const firstNewline = cleanedText.indexOf('\n');
      if (firstNewline !== -1) {
        cleanedText = cleanedText.slice(firstNewline + 1);
      }
      if (cleanedText.trimEnd().endsWith('```')) {
        cleanedText = cleanedText.trimEnd().slice(0, -3).trimEnd();
      }
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      // Last-resort: use extractStructuredJsonCandidate which tries regex-based extraction
      const extracted = extractStructuredJsonCandidate(cleanedText);
      if (extracted && typeof extracted === 'object') {
        parsedData = extracted;
      } else {
        throw new Error('The AI response could not be parsed. Please try again.');
      }
    }

    const candidates: unknown[] = [
      // Candidate 0: raw parsed JSON (field names exactly as returned by model)
      parsedData,
      // Candidate 1: CaseUnderstanding-aware normalization (handles Gemini response shape)
      normalizeStructuredPayload(parsedData as Record<string, unknown>) as T,
      // Candidate 2: Universal snake_case → camelCase conversion
      // Handles Groq responses where fields come back as evidence_gaps, action_steps, etc.
      camelCaseify(parsedData),
    ];
    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        const validated = zodSchema.parse(candidate);
        console.log('[AI] normalization=pass');
        console.log('[AI] zod=pass');
        return validated;
      } catch (error) {
        lastError = error;
      }
    }

    // Surface a human-readable error, not a raw ZodError schema dump
    const zodMsg = lastError instanceof Error ? lastError.message : String(lastError);
    const firstIssue = zodMsg.includes('"path"') ? '' : ` (${zodMsg.slice(0, 120)})`;
    throw new Error(`AI analysis could not be completed — the response did not match the expected format.${firstIssue} Please try again.`);
  };

  // ─── GROQ PRIMARY / DEMO MODE ───────────────────────────────────────────────
  if (isGroqPrimary()) {
    console.log('[AI] primary=groq');
    console.log('[AI] groq request started');

    try {
      const backendResponse = await callSecureBackendGenerate<{
        status: string;
        message: string;
        provider?: string;
        model?: string;
        text?: string;
      }>({
        prompt,
        systemPrompt:
          'You are a careful legal assistance model. Return valid JSON only matching the requested schema and respect the task instructions exactly.',
        capability: 'structured',
      });

      if (backendResponse.status !== 'ok' || !backendResponse.text) {
        throw new Error('AI service is temporarily busy. Please try again shortly.');
      }

      console.log('[AI] groq response received');
      const validated = parseAndValidateStructuredResponse(backendResponse.text);

      return {
        data: validated,
        model: backendResponse.model || 'qwen/qwen3.8-27b',
        generatedAt: new Date().toISOString(),
      };
    } catch (groqError) {
      console.warn('[AI] primary Groq call failed:', groqError);

      if (isGroqOnly() || isPermanentConfigurationError(groqError)) {
        throw new Error(sanitizeUserFacingErrorMessage(groqError));
      }

      const classified = classifyAIError(groqError);
      if (!classified.canFallback) {
        throw new Error(classified.userMessage);
      }

      console.log('[AI] Groq temporarily unavailable — falling back to Gemini (attempt 1/1)');
      try {
        const ai = getAIInstance();
        const primaryModel = getGenerativeModel(ai, {
          model: STRUCTURED_MODEL.model,
          generationConfig: {
            ...STRUCTURED_MODEL.generationConfig,
            responseSchema: firebaseSchema,
          },
          safetySettings: STRUCTURED_MODEL.safetySettings,
        });

        const geminiRes = await primaryModel.generateContent(prompt);
        const text = geminiRes.response.text();
        const validated = parseAndValidateStructuredResponse(text);

        return {
          data: validated,
          model: `${STRUCTURED_MODEL.model} (fallback)`,
          generatedAt: new Date().toISOString(),
          promptTokens: geminiRes.response.usageMetadata?.promptTokenCount,
          candidateTokens: geminiRes.response.usageMetadata?.candidatesTokenCount,
        };
      } catch (geminiError) {
        console.error('[AI] Both Groq and Gemini fallback failed:', geminiError);
        // Preserve the original Groq error message when it's more specific (e.g., rate limit).
        // If Groq returned a rate limit / temporary error, surface that — not Gemini's
        // unrelated "Firebase not configured" or generic failure.
        const groqClassified = classifyAIError(groqError);
        const geminiClassified = classifyAIError(geminiError);
        // Use Groq's message if it is more meaningful (rate limit > configuration error > unknown)
        const useGroqMessage =
          groqClassified.code === 'AI_RATE_LIMIT' ||
          groqClassified.code === 'AI_TEMPORARY_UNAVAILABLE' ||
          groqClassified.code === 'AI_TIMEOUT' ||
          geminiClassified.code === 'AI_CONFIGURATION' ||
          geminiClassified.code === 'AI_UNKNOWN';
        throw new Error(useGroqMessage ? groqClassified.userMessage : geminiClassified.userMessage);
      }
    }
  }

  // ─── GEMINI PRIMARY / NORMAL MODE ───────────────────────────────────────────
  console.log('[AI] primary=gemini');
  console.log('[AI] gemini request started');

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
      console.log('[AI] falling back to backend Groq');
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
