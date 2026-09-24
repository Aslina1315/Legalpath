/**
 * AI response schemas.
 * Each schema has:
 *   1. A Zod schema for runtime validation on the client
 *   2. A Firebase AI responseSchema for structured output mode
 */

import { z } from 'zod';
import type { Schema } from 'firebase/ai';
import { SchemaType } from 'firebase/ai';

// ─── System Readiness Schema ─────────────────────────────────────────────────

export const SystemReadinessZodSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  model: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

export type SystemReadinessSchema = z.infer<typeof SystemReadinessZodSchema>;

export const SYSTEM_READINESS_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    status: { type: SchemaType.STRING, enum: ['ok', 'degraded'], nullable: false },
    model: { type: SchemaType.STRING, nullable: false },
    message: { type: SchemaType.STRING, nullable: false },
    timestamp: { type: SchemaType.STRING, nullable: false },
  },
  required: ['status', 'model', 'message', 'timestamp'],
  nullable: false,
};

// ─── Case Intake Schema (Planned — not active yet) ────────────────────────────

/**
 * CaseIntakeSchema — structured output from the intake AI stage.
 * PLANNED: Will be activated when intake AI module is implemented.
 */
export const CaseIntakeZodSchema = z.object({
  summary: z.string(),
  detectedJurisdiction: z.string().optional(),
  legalDomains: z.array(z.string()),
  keyFacts: z.array(z.string()),
  entities: z.array(z.object({
    name: z.string(),
    role: z.string(),
  })),
  urgencyLevel: z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']),
  clarificationNeeded: z.array(z.string()),
});

export type CaseIntakeResult = z.infer<typeof CaseIntakeZodSchema>;

// ─── CaseIntake Firebase Schema ───────────────────────────────────────────────

export const CASE_INTAKE_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING, nullable: false },
    detectedJurisdiction: { type: SchemaType.STRING, nullable: true },
    legalDomains: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    keyFacts: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, nullable: false },
          role: { type: SchemaType.STRING, nullable: false },
        },
        required: ['name', 'role'],
        nullable: false,
      },
      nullable: false,
    },
    urgencyLevel: {
      type: SchemaType.STRING,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
      nullable: false,
    },
    clarificationNeeded: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
  },
  required: ['summary', 'legalDomains', 'keyFacts', 'entities', 'urgencyLevel', 'clarificationNeeded'],
  nullable: false,
};

// ─── Case Structure Schema (AI Module 02) ─────────────────────────────────────

const TimelineEventZod = z.object({
  description: z.string(),
  date: z.string().optional(),
  approximateDate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

const StructuredEntityZod = z.object({
  name: z.string(),
  role: z.enum(['CLAIMANT', 'RESPONDENT', 'WITNESS', 'THIRD_PARTY', 'INSTITUTION', 'OTHER']),
  notes: z.string().optional(),
});

const StructuredFactZod = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
});

export const CaseStructureZodSchema = z.object({
  timeline: z.array(TimelineEventZod),
  entities: z.array(StructuredEntityZod),
  structuredFacts: z.array(StructuredFactZod),
  evidenceAvailable: z.array(z.string()),
  evidenceMissing: z.array(z.string()),
});

export type CaseStructureResult = z.infer<typeof CaseStructureZodSchema>;

export const CASE_STRUCTURE_FIREBASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    timeline: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          description: { type: SchemaType.STRING, nullable: false },
          date: { type: SchemaType.STRING, nullable: true },
          approximateDate: { type: SchemaType.STRING, nullable: true },
          confidence: { type: SchemaType.NUMBER, nullable: false },
        },
        required: ['description', 'confidence'],
        nullable: false,
      },
      nullable: false,
    },
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, nullable: false },
          role: {
            type: SchemaType.STRING,
            enum: ['CLAIMANT', 'RESPONDENT', 'WITNESS', 'THIRD_PARTY', 'INSTITUTION', 'OTHER'],
            nullable: false,
          },
          notes: { type: SchemaType.STRING, nullable: true },
        },
        required: ['name', 'role'],
        nullable: false,
      },
      nullable: false,
    },
    structuredFacts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, nullable: false },
          confidence: { type: SchemaType.NUMBER, nullable: false },
        },
        required: ['text', 'confidence'],
        nullable: false,
      },
      nullable: false,
    },
    evidenceAvailable: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
    evidenceMissing: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, nullable: false },
      nullable: false,
    },
  },
  required: ['timeline', 'entities', 'structuredFacts', 'evidenceAvailable', 'evidenceMissing'],
  nullable: false,
};
