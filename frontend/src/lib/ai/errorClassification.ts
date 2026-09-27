/**
 * Centralized AI Error Classification and User-Facing Message Sanitizer.
 *
 * Ensures technical internal errors (Zod, stack traces, provider payloads, URLs,
 * App Check tokens, auth details) are NEVER leaked to the end user.
 */

export type AIErrorCode =
  | 'AI_RATE_LIMIT'
  | 'AI_TEMPORARY_UNAVAILABLE'
  | 'AI_TIMEOUT'
  | 'AI_NETWORK'
  | 'AI_INVALID_JSON'
  | 'AI_SCHEMA_VALIDATION'
  | 'AI_APPCHECK_INVALID'
  | 'AI_AUTH'
  | 'AI_CONFIGURATION'
  | 'AI_PROVIDER_FAILURE'
  | 'AI_EVIDENCE_FAILURE'
  | 'AI_UNKNOWN';

export interface ClassifiedAIError {
  code: AIErrorCode;
  userMessage: string;
  isRetryable: boolean;
  canFallback: boolean;
}

export function classifyAIError(error: unknown): ClassifiedAIError {
  const rawMsg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : (error && typeof error === 'object' && 'message' in error)
      ? String((error as { message: unknown }).message)
      : String(error ?? '');

  const msg = rawMsg.toLowerCase();

  // App Check & Security
  if (
    msg.includes('appcheck') ||
    msg.includes('app-check') ||
    msg.includes('app_check') ||
    msg.includes('recaptcha') ||
    msg.includes('attestation')
  ) {
    return {
      code: 'AI_APPCHECK_INVALID',
      userMessage: 'Security verification is temporarily unavailable. Please refresh or try again shortly.',
      isRetryable: true,
      canFallback: false,
    };
  }

  // Rate Limits (429, quota, resource_exhausted, our own sanitized messages)
  if (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('request limit') ||
    msg.includes('too many requests') ||
    msg.includes('generaterequestsperminute') ||
    msg.includes('groq_rate_limited') ||
    msg.includes('rate limited') ||
    msg.includes('wait a moment')
  ) {
    return {
      code: 'AI_RATE_LIMIT',
      userMessage: 'AI is temporarily at its request limit. Please wait a moment and retry.',
      isRetryable: true,
      canFallback: true,
    };
  }

  // Timeouts & Network
  if (msg.includes('timeout') || msg.includes('deadline_exceeded') || msg.includes('timed out')) {
    return {
      code: 'AI_TIMEOUT',
      userMessage: 'The AI request timed out. Please try again.',
      isRetryable: true,
      canFallback: true,
    };
  }

  if (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('connection error') ||
    msg.includes('load failed')
  ) {
    return {
      code: 'AI_NETWORK',
      userMessage: 'Network connection issue. Please check your connection and retry.',
      isRetryable: true,
      canFallback: true,
    };
  }

  // Temporary provider availability (500, 502, 503, unavailable, overloaded)
  if (
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('500') ||
    msg.includes('unavailable') ||
    msg.includes('temporarily busy') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('internal server error')
  ) {
    return {
      code: 'AI_TEMPORARY_UNAVAILABLE',
      userMessage: 'AI is temporarily busy. Please retry in a moment.',
      isRetryable: true,
      canFallback: true,
    };
  }

  // JSON & Schema Validation (Zod, parse errors)
  if (
    msg.includes('zod') ||
    msg.includes('invalid_type') ||
    msg.includes('required') ||
    msg.includes('expected string') ||
    msg.includes('schema') ||
    msg.includes('validation')
  ) {
    return {
      code: 'AI_SCHEMA_VALIDATION',
      userMessage: 'AI analysis could not be completed — the response did not match the expected format. Please try again.',
      isRetryable: true,
      canFallback: true,
    };
  }

  if (
    msg.includes('json') ||
    msg.includes('unexpected token') ||
    msg.includes('parse') ||
    msg.includes('syntaxerror')
  ) {
    return {
      code: 'AI_INVALID_JSON',
      userMessage: 'The AI response could not be parsed. Please try again.',
      isRetryable: true,
      canFallback: true,
    };
  }

  // Authentication & Configuration
  if (
    msg.includes('auth/') ||
    msg.includes('unauthorized') ||
    msg.includes('invalid-api-key') ||
    msg.includes('permission_denied') ||
    msg.includes('forbidden')
  ) {
    return {
      code: 'AI_AUTH',
      userMessage: 'Authentication or security access failed. Please try again.',
      isRetryable: false,
      canFallback: false,
    };
  }

  if (msg.includes('not configured') || msg.includes('configuration-not-found')) {
    return {
      code: 'AI_CONFIGURATION',
      userMessage: 'AI service configuration is temporarily unavailable. Please retry shortly.',
      isRetryable: false,
      canFallback: false,
    };
  }

  // Evidence analysis specific
  if (msg.includes('evidence') || msg.includes('file read') || msg.includes('document')) {
    return {
      code: 'AI_EVIDENCE_FAILURE',
      userMessage: 'Could not process attached evidence. Please verify the file format and try again.',
      isRetryable: true,
      canFallback: false,
    };
  }

  return {
    code: 'AI_UNKNOWN',
    userMessage: 'An unexpected issue occurred while analyzing your case. Please try again.',
    isRetryable: true,
    canFallback: false,
  };
}

/**
 * Returns a clean, user-safe message guaranteed to contain no technical jargon.
 */
export function sanitizeUserFacingErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  const classified = classifyAIError(error);
  return classified.userMessage;
}
