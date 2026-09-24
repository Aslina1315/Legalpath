/**
 * Primary intake form — "Tell us what happened"
 *
 * Stage 3: Full 2-module AI pipeline.
 *
 * Pipeline:
 *   1. User submits narrative
 *   2. Module 01: Intake Understanding (UNDERSTANDING state)
 *      → Shows CaseResultCard
 *   3. Module 02: Case Structuring (ANALYZING state)
 *      → Shows CaseStructureCard
 *   4. Auto-save to Firestore (or nudge to sign in)
 *
 * Auth is optional at intake — user sees results without signing in,
 * but saving to Firestore requires an account (handled by SaveCasePrompt).
 */

'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { AIStateIndicator } from './AIStateIndicator';
import { CaseResultCard } from './CaseResultCard';
import { CaseStructureCard } from './CaseStructureCard';
import { SaveCasePrompt } from './SaveCasePrompt';
import { useAppStore } from '@/store/useAppStore';
import { useCaseStore } from '@/store/useCaseStore';
import { runIntakeUnderstanding } from '@/lib/ai/intakeModule';
import { runCaseStructuring } from '@/lib/ai/caseStructureModule';
import type { CaseIntakeResult, CaseStructureResult } from '@/lib/ai/schemas';

const MAX_CHARS = 5000;
const MIN_CHARS = 50;

interface PipelineResult {
  intake: { data: CaseIntakeResult; generatedAt: string; model: string };
  structure?: { data: CaseStructureResult; generatedAt: string };
}

export function IntakeForm() {
  const { aiState, setAIState, setAIError, resetAIState } = useAppStore();
  const { narrativeInput, setNarrativeInput, isSubmitting, setIsSubmitting, setCurrentDraft, currentDraft } = useCaseStore();

  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNarrativeInput(e.target.value);
      if (validationError && e.target.value.length >= MIN_CHARS) {
        setValidationError(undefined);
      }
      // Clear results when narrative is edited
      if (pipelineResult) {
        setPipelineResult(null);
        resetAIState();
      }
    },
    [setNarrativeInput, validationError, pipelineResult, resetAIState]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (narrativeInput.trim().length < MIN_CHARS) {
        setValidationError(
          `Please tell us a bit more — at least ${MIN_CHARS} characters helps us understand your situation.`
        );
        return;
      }

      setValidationError(undefined);
      setPipelineResult(null);
      setIsSubmitting(true);

      try {
        // ─── Module 01: Intake Understanding ──────────────────────────────
        setAIState('UNDERSTANDING');
        const intakeResponse = await runIntakeUnderstanding(narrativeInput);

        const intakeDraft = {
          narrative: narrativeInput.trim(),
          status: 'INTAKE' as const,
          timestamps: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            intakeCompletedAt: intakeResponse.generatedAt,
          },
          jurisdiction: intakeResponse.data.detectedJurisdiction,
          aiPipelineVersion: '3.0',
        };
        setCurrentDraft(intakeDraft);

        // Show Module 01 result while Module 02 runs
        setPipelineResult({
          intake: {
            data: intakeResponse.data,
            generatedAt: intakeResponse.generatedAt,
            model: intakeResponse.model,
          },
        });

        // ─── Module 02: Case Structuring ───────────────────────────────────
        setAIState('ANALYZING');
        const structureResponse = await runCaseStructuring(narrativeInput, intakeResponse.data);

        // Merge structured data into the draft
        setCurrentDraft({
          ...intakeDraft,
          structuredFacts: structureResponse.data.structuredFacts.map((f, i) => ({
            id: `fact-${i}`,
            text: f.text,
            confidence: f.confidence,
          })),
          entities: structureResponse.data.entities.map((ent, i) => ({
            id: `entity-${i}`,
            name: ent.name,
            role: ent.role,
            notes: ent.notes,
          })),
          timeline: structureResponse.data.timeline.map((ev, i) => ({
            id: `event-${i}`,
            description: ev.description,
            date: ev.date,
            approximateDate: ev.approximateDate,
            confidence: ev.confidence,
          })),
          timestamps: {
            ...intakeDraft.timestamps,
            updatedAt: structureResponse.generatedAt,
            analysisCompletedAt: structureResponse.generatedAt,
          },
          status: 'STRUCTURED' as const,
        });

        setPipelineResult((prev) => prev ? ({
          ...prev,
          structure: {
            data: structureResponse.data,
            generatedAt: structureResponse.generatedAt,
          },
        }) : null);

        setAIState('READY');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        setAIError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [narrativeInput, setAIState, setAIError, setIsSubmitting, setCurrentDraft]
  );

  const charCount = narrativeInput.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isProcessing = isSubmitting || aiState === 'UNDERSTANDING' || aiState === 'ANALYZING';
  const hasResult = aiState === 'READY' && pipelineResult !== null;
  const hasIntakeResult = pipelineResult?.intake != null;

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        aria-label="Tell us what happened"
        noValidate
      >
        <Textarea
          label="What happened?"
          hint="Describe your situation in your own words. The more detail you share, the better we can help."
          placeholder="For example: My landlord refused to return my deposit after I moved out and won't respond to my messages..."
          value={narrativeInput}
          onChange={handleChange}
          error={validationError}
          charCount={charCount}
          maxChars={MAX_CHARS}
          disabled={isProcessing}
          maxLength={MAX_CHARS + 200}
          aria-required="true"
        />

        {/* Voice/Language slots — Stage 4 */}
        <div aria-hidden="true" className="hidden">
          {/* TODO: Voice input (useVoiceInput) — Stage 4 */}
          {/* TODO: Language selector — Stage 4 */}
        </div>

        {/* Pipeline progress */}
        <AIStateIndicator state={aiState} />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isProcessing}
          loadingText={
            aiState === 'ANALYZING'
              ? 'Building case structure…'
              : 'Understanding your situation…'
          }
          disabled={isOverLimit || isProcessing}
          className="w-full sm:w-auto sm:self-end"
        >
          {hasResult ? 'Analyse again' : 'Continue'}
        </Button>
      </form>

      {/* Module 01 result — shown as soon as Module 01 completes */}
      {hasIntakeResult && pipelineResult?.intake && (
        <CaseResultCard
          result={pipelineResult.intake.data}
          generatedAt={pipelineResult.intake.generatedAt}
          model={pipelineResult.intake.model}
        />
      )}

      {/* Module 02 result */}
      {hasResult && pipelineResult?.structure && (
        <CaseStructureCard
          structure={pipelineResult.structure.data}
          generatedAt={pipelineResult.structure.generatedAt}
        />
      )}

      {/* Save prompt — shown after full pipeline completes */}
      {hasResult && currentDraft && (
        <SaveCasePrompt draft={currentDraft} />
      )}
    </div>
  );
}
