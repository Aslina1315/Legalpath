/**
 * Primary intake form — "Tell us what happened"
 *
 * Drives the continuous AI-guided legal access journey:
 *   1. User submits narrative
 *   2. Module 01: Intake Understanding (UNDERSTANDING state)
 *   3. Module 02: Case Structuring (STRUCTURING state)
 *   4. Module 03: Domain & Jurisdiction Routing (RESEARCHING state)
 *   5. Module 05: Live Legal Knowledge Retrieval (RESEARCHING state)
 *   6. Module 07: Evidence Gap Audit (COMPARING state)
 *   7. Module 08: Contradiction Detection (COMPARING state)
 *   8. Module 09: Response Verification (VERIFYING state)
 *   9. Module 10: Action Path Construction (PLANNING state)
 *   10. Continuous Case Workspace (READY state)
 */

'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { AIStateIndicator } from './AIStateIndicator';
import { ContinuousCaseWorkspace } from './ContinuousCaseWorkspace';
import { useAppStore } from '@/store/useAppStore';
import { useCaseStore } from '@/store/useCaseStore';

import { runIntakeUnderstanding } from '@/lib/ai/intakeModule';
import { runCaseStructuring } from '@/lib/ai/caseStructureModule';
import { runDomainRouting } from '@/lib/ai/domainRoutingModule';
import { runKnowledgeRetrieval } from '@/lib/ai/knowledgeRetrievalModule';
import { runEvidenceGapDetection } from '@/lib/ai/evidenceGapModule';
import { runContradictionDetection } from '@/lib/ai/contradictionModule';
import { runResponseVerification } from '@/lib/ai/responseVerifierModule';
import { runActionPathPlan } from '@/lib/ai/actionPathModule';

import type { CaseStructureResult } from '@/lib/ai/schemas';

const MAX_CHARS = 5000;
const MIN_CHARS = 50;

export function IntakeForm() {
  const { aiState, setAIState, setAIError, resetAIState } = useAppStore();
  const {
    narrativeInput,
    setNarrativeInput,
    isSubmitting,
    setIsSubmitting,
    setCurrentDraft,
    currentDraft,
    clearDraft,
  } = useCaseStore();

  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [structuredResult, setStructuredResult] = useState<CaseStructureResult | undefined>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNarrativeInput(e.target.value);
      if (validationError && e.target.value.length >= MIN_CHARS) {
        setValidationError(undefined);
      }
    },
    [setNarrativeInput, validationError]
  );

  const handleReset = useCallback(() => {
    clearDraft();
    setStructuredResult(undefined);
    resetAIState();
  }, [clearDraft, resetAIState]);

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
      setIsSubmitting(true);

      try {
        // ─── Module 01: Intake Understanding ──────────────────────────────
        setAIState('UNDERSTANDING');
        const intakeResponse = await runIntakeUnderstanding(narrativeInput);

        const initialDraft = {
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
        setCurrentDraft(initialDraft);

        // ─── Module 02: Case Structuring ───────────────────────────────────
        setAIState('STRUCTURING');
        const structureResponse = await runCaseStructuring(narrativeInput, intakeResponse.data);
        setStructuredResult(structureResponse.data);

        // ─── Module 03: Domain & Jurisdiction Routing ───────────────────────
        setAIState('RESEARCHING');
        const domainResponse = await runDomainRouting({
          narrative: narrativeInput,
          facts: structureResponse.data.structuredFacts.map((f) => f.text),
          locationHint: intakeResponse.data.detectedJurisdiction,
        });

        // ─── Module 05: Live Knowledge Retrieval (Google Search) ────────────
        const retrievalResponse = await runKnowledgeRetrieval({
          structuredFacts: structureResponse.data.structuredFacts,
          domain: domainResponse.data.domain,
          subDomain: domainResponse.data.subDomain,
          jurisdiction: domainResponse.data.jurisdiction,
        });

        // ─── Module 07: Evidence Gap Audit ──────────────────────────────────
        setAIState('COMPARING');
        const gapsResponse = await runEvidenceGapDetection({
          narrative: narrativeInput,
          structure: structureResponse.data,
          evidence: [],
          retrievedKnowledge: retrievalResponse.data,
        });

        // ─── Module 08: Contradiction Detection ─────────────────────────────
        const contradictionsResponse = await runContradictionDetection({
          narrative: narrativeInput,
          structure: structureResponse.data,
          evidence: [],
          userClarifications: {},
        });

        // ─── Module 09: Response Verification ───────────────────────────────
        setAIState('VERIFYING');
        const initialDraftResponse = `Assessment for ${domainResponse.data.domain} in ${domainResponse.data.jurisdiction}: Analysis of facts and retrieved rules confirms procedural prerequisites.`;
        const verificationResponse = await runResponseVerification({
          draftResponse: initialDraftResponse,
          retrievedKnowledge: retrievalResponse.data,
          structuredFacts: structureResponse.data.structuredFacts,
          jurisdiction: domainResponse.data.jurisdiction,
        });

        // ─── Module 10: Action Path ─────────────────────────────────────────
        setAIState('PLANNING');
        const actionPathResponse = await runActionPathPlan({
          currentSituation: verificationResponse.data.verifiedSummary,
          verifiedClaims: verificationResponse.data.claims,
          evidenceGaps: gapsResponse.data,
          contradictions: contradictionsResponse.data,
          domain: domainResponse.data.domain,
          jurisdiction: domainResponse.data.jurisdiction,
        });

        // Update complete draft in store
        setCurrentDraft({
          ...initialDraft,
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
          domainRouting: domainResponse.data,
          knowledgeRetrieval: retrievalResponse.data,
          evidenceGaps: gapsResponse.data,
          contradictions: contradictionsResponse.data,
          responseVerification: verificationResponse.data,
          actionPath: actionPathResponse.data,
          status: 'ACTIONABLE',
          timestamps: {
            ...initialDraft.timestamps,
            updatedAt: new Date().toISOString(),
            analysisCompletedAt: new Date().toISOString(),
          },
        });

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
  const isProcessing =
    isSubmitting ||
    (aiState !== 'IDLE' && aiState !== 'READY' && aiState !== 'ERROR');
  const hasResult =
    aiState === 'READY' &&
    currentDraft !== null &&
    currentDraft.domainRouting !== undefined;

  // Once the continuous pipeline has produced results, render the unified ContinuousCaseWorkspace
  if (hasResult) {
    return (
      <ContinuousCaseWorkspace
        initialStructure={structuredResult}
        onReset={handleReset}
      />
    );
  }

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
          placeholder="For example: My landlord refused to return my $1,500 security deposit after I moved out on June 30th in Austin, Texas. They claimed repairs were needed but provided no itemized list within 30 days..."
          value={narrativeInput}
          onChange={handleChange}
          error={validationError}
          charCount={charCount}
          maxChars={MAX_CHARS}
          disabled={isProcessing}
          maxLength={MAX_CHARS + 200}
          aria-required="true"
        />

        {/* Pipeline progress */}
        <AIStateIndicator state={aiState} />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isProcessing}
          loadingText={
            aiState === 'UNDERSTANDING'
              ? 'Understanding your situation…'
              : aiState === 'STRUCTURING'
              ? 'Structuring case facts & timeline…'
              : aiState === 'RESEARCHING'
              ? 'Researching live legal authorities…'
              : aiState === 'COMPARING'
              ? 'Auditing evidence & discrepancies…'
              : aiState === 'VERIFYING'
              ? 'Verifying claims against authorities…'
              : aiState === 'PLANNING'
              ? 'Formulating your action path…'
              : 'Processing case journey…'
          }
          disabled={isOverLimit || isProcessing}
          className="w-full sm:w-auto sm:self-end"
        >
          Continue
        </Button>
      </form>
    </div>
  );
}
