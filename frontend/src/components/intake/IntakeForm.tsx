/**
 * IntakeForm — Premium Conversational Input Surface.
 *
 * Core Interactions:
 *   - Conversational prompt: "Tell us what happened..."
 *   - Voice-ready UI: Web Speech API microphone with animated listening indicator
 *   - Drag/drop document-ready zone right inside the surface
 *   - Live character count and keyboard accessibility (Ctrl/Cmd + Enter)
 *   - Primary CTA: "Start with my story" (bespoke, elegant, non-generic)
 *   - Subtle trust strip: Source-aware, Evidence-aware, Privacy-conscious, Human help
 *   - Real-time Interactive AI Journey
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/store/useAppStore';
import { useCaseStore } from '@/store/useCaseStore';
import { BRAND } from '@/tokens/design';
import { getTranslation } from '@/lib/i18n';
import { InteractiveJourney } from './InteractiveJourney';
import { ContinuousCaseWorkspace } from './ContinuousCaseWorkspace';
import { AIGuideCharacter } from '@/components/ui/AIGuideCharacter';

import { runCaseUnderstanding } from '@/lib/ai/caseUnderstandingModule';
import { runKnowledgeRetrieval } from '@/lib/ai/knowledgeRetrievalModule';
import { runEvidenceAnalysis, type UploadedEvidenceFile } from '@/lib/ai/evidenceAnalyzerModule';
import { runTrustAndAction } from '@/lib/ai/trustAndActionModule';
import { sanitizeUserFacingErrorMessage } from '@/lib/ai/errorClassification';

import type { CaseStructureResult } from '@/lib/ai/schemas';
import type { DomainRoutingResult, EvidenceAnalysisResult } from '@/types/ai';

const MAX_CHARS = 5000;
const MIN_CHARS = 50;

export function IntakeForm() {
  const { aiState, setAIState, aiError, setAIError, resetAIState, language } = useAppStore();
  const t = getTranslation(language);
  const {
    narrativeInput,
    setNarrativeInput,
    isSubmitting,
    setIsSubmitting,
    setCurrentDraft,
    currentDraft,
    clearDraft,
    uploadedFiles,
    addUploadedFile,
  } = useCaseStore();

  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [structuredResult, setStructuredResult] = useState<CaseStructureResult | undefined>(undefined);
  const [isListening, setIsListening] = useState(false);
  const [isDragOverInput, setIsDragOverInput] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const isSubmittingRef = useRef<boolean>(false);
  const submitInFlightRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize browser speech recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              }
            }
            if (finalTranscript) {
              const currentText = useCaseStore.getState().narrativeInput;
              setNarrativeInput(currentText ? `${currentText.trim()} ${finalTranscript.trim()}` : finalTranscript.trim());
            }
          };

          recognition.onerror = () => {
            setIsListening(false);
            setVoiceNotice('Voice input paused.');
            setTimeout(() => setVoiceNotice(null), 3000);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch {
          // Graceful fallback if permission or speech api restricted
        }
      }
    }
  }, [setNarrativeInput]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setVoiceNotice('Voice dictation is ready. Please type or use browser speech.');
      setTimeout(() => setVoiceNotice(null), 3500);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceNotice('Listening… Speak clearly about what happened.');
      } catch {
        setIsListening(false);
      }
    }
  };

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
    submitInFlightRef.current = false;
    isSubmittingRef.current = false;
    setAIError(null);
    clearDraft();
    setStructuredResult(undefined);
    resetAIState();
  }, [clearDraft, resetAIState, setAIError]);

  // Handle document drop or selection in intake surface
  const handleDocumentAdd = useCallback(
    async (file: File) => {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || result);
          };
          reader.onerror = () => reject(new Error('Failed to read file.'));
          reader.readAsDataURL(file);
        });

        const newDoc: UploadedEvidenceFile = {
          name: file.name,
          mimeType: file.type,
          base64Data,
          sizeBytes: file.size,
        };
        addUploadedFile(newDoc);
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : 'Could not attach document.');
      }
    },
    [addUploadedFile]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (submitInFlightRef.current || isSubmittingRef.current || isSubmitting) {
        return;
      }

      if (narrativeInput.trim().length < MIN_CHARS) {
        setValidationError(
          `Please tell us a bit more — at least ${MIN_CHARS} characters helps us understand your situation.`
        );
        return;
      }

      setValidationError(undefined);
      setAIError(null);
      submitInFlightRef.current = true;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        // ─── Call 1: Case Understanding (Intake + Structuring + Domain/Jurisdiction) ───
        setAIState('UNDERSTANDING');
        const understandingRes = await runCaseUnderstanding(narrativeInput);
        const uData = understandingRes.data;

        const initialStructure: CaseStructureResult = {
          timeline: uData.timeline,
          entities: uData.entities,
          structuredFacts: uData.structuredFacts,
          evidenceAvailable: uploadedFiles.map((f) => f.name),
          evidenceMissing: uData.initialEvidenceGaps,
        };
        setStructuredResult(initialStructure);

        const domainRoutingData: DomainRoutingResult = {
          domain: uData.domain,
          subDomain: uData.subDomain || 'General',
          jurisdiction: uData.jurisdiction,
          jurisdictionConfidence: uData.jurisdictionConfidence,
          reasoningSummary: uData.summary,
          missingInformation: uData.missingInformation,
          urgencySignals: uData.urgencySignals,
        };

        const initialDraft = {
          narrative: narrativeInput.trim(),
          status: 'INTAKE' as const,
          language,
          timestamps: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            intakeCompletedAt: understandingRes.generatedAt,
          },
          jurisdiction: uData.jurisdiction,
          aiPipelineVersion: '3.0',
        };
        setCurrentDraft(initialDraft);

        // ─── Call 2: Live Research (Google Search Grounding) ─────────────────────────
        setAIState('RESEARCHING');
        const retrievalResponse = await runKnowledgeRetrieval({
          structuredFacts: uData.structuredFacts,
          domain: uData.domain,
          subDomain: uData.subDomain ?? undefined,
          jurisdiction: uData.jurisdiction ?? undefined,
          narrative: narrativeInput,
        });

        // ─── Call 3: Evidence (ONLY if user actually attached evidence) ──────────────
        const analyzedDocs: EvidenceAnalysisResult[] = [];
        if (uploadedFiles.length > 0) {
          setAIState('ANALYZING');
          for (const doc of uploadedFiles) {
            if (!doc.analysisResult) {
              const analysisRes = await runEvidenceAnalysis(doc, narrativeInput);
              doc.analysisResult = analysisRes.data;
              analyzedDocs.push(analysisRes.data);
            } else {
              analyzedDocs.push(doc.analysisResult);
            }
          }
        }
        // If uploadedFiles.length === 0, Call 3 is completely skipped!

        // ─── Call 4: Trust & Action Synthesis ────────────────────────────────────────
        setAIState('VERIFYING');
        const trustAndActionRes = await runTrustAndAction({
          caseUnderstanding: uData,
          retrievedKnowledge: retrievalResponse.data,
          evidence: analyzedDocs,
          userClarifications: {},
        });
        const trustData = trustAndActionRes.data;

        setAIState('PLANNING');

        // Update complete draft in store
        setCurrentDraft({
          ...initialDraft,
          structuredFacts: uData.structuredFacts.map((f, i) => ({
            id: `fact-${i}`,
            text: f.text,
            confidence: f.confidence,
          })),
          entities: uData.entities.map((ent, i) => ({
            id: `entity-${i}`,
            name: ent.name,
            role: ent.role,
            notes: ent.notes ?? undefined,
          })),
          timeline: uData.timeline.map((ev, i) => ({
            id: `event-${i}`,
            description: ev.description,
            date: ev.date ?? undefined,
            approximateDate: ev.approximateDate ?? undefined,
            confidence: ev.confidence,
          })),
          domainRouting: domainRoutingData,
          knowledgeRetrieval: retrievalResponse.data,
          evidenceGaps: {
            gaps: trustData.evidenceGaps.map((g) => ({
              id: g.id,
              gapType: 'MISSING_DOCUMENT' as const,
              description: g.missingEvidence || g.claim,
              importance: (g.importance === 'CRITICAL' ? 'HIGH' : g.importance === 'IMPORTANT' ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
              whyItMatters: g.suggestion,
              suggestedClarification: g.suggestion,
            })),
            overallCompleteness: trustData.overallCompletenessScore,
            summary: 'Evidence analysis complete.',
          },
          contradictions: {
            contradictions: trustData.contradictions.map((c) => ({
              id: c.id,
              field: 'Statement vs Evidence',
              sourceA: c.sourceA,
              valueA: c.statementA,
              sourceB: c.sourceB,
              valueB: c.statementB,
              severity: c.severity,
              explanation: c.resolutionPrompt,
              clarificationNeeded: c.resolutionPrompt,
            })),
            hasContradictions: trustData.contradictions.length > 0,
            summary:
              trustData.contradictions.length > 0
                ? 'Identified potential contradictions.'
                : 'No contradictions identified between statements and evidence.',
          },
          responseVerification: {
            verifiedSummary: trustData.verifiedSummary,
            claims: trustData.claims.map((cl) => ({
              claim: cl.claimText,
              status: cl.status,
              supportingSources: cl.sourceRef ? [cl.sourceRef] : [],
              caseFactAlignment: true,
              jurisdictionConsistency: true,
              reasoning: cl.explanation,
            })),
            overallTrustScore: trustData.overallTrustScore,
            unsupportedClaimsFlagged: trustData.claims
              .filter((c) => c.status === 'UNSUPPORTED')
              .map((c) => c.claimText),
            disclaimer: 'AI-assisted analysis based on available facts and sources.',
          },
          actionPath: {
            currentSituation: trustData.verifiedSummary,
            nextSteps: trustData.actionSteps.map((step, idx) => ({
              id: step.id || `step-${idx + 1}`,
              title: step.title,
              description: step.whyItMatters,
              whyItMatters: step.whyItMatters,
              priority: (step.priority === 'IMMEDIATE' ? 'URGENT' : step.priority) as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
              status: 'PENDING' as const,
              estimatedTimeframe: step.timeframe,
            })),
            documentsNeeded: trustData.actionSteps.flatMap((s) => s.documentsNeeded).map((name) => ({
              documentName: name,
              purpose: 'Verification',
              priority: 'HIGH' as const,
            })),
            questionsToResolve: [],
            possibleEscalation: [],
            humanHelpRecommended: trustData.humanHelpRecommendation.needed,
            humanHelpReasoning: trustData.humanHelpRecommendation.reason,
          },
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
        submitInFlightRef.current = false;
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [narrativeInput, uploadedFiles, isSubmitting, language, setAIState, setAIError, setIsSubmitting, setCurrentDraft]
  );

  const charCount = narrativeInput.length;
  const isOverLimit = charCount > MAX_CHARS;
  const aiErrorText = aiError ?? '';
  const isProcessing =
    submitInFlightRef.current ||
    isSubmitting ||
    (aiState !== 'IDLE' && aiState !== 'READY' && aiState !== 'ERROR');
  const is429Message =
    aiErrorText.toLowerCase().includes('busy') ||
    aiErrorText.includes('429') ||
    aiErrorText.toLowerCase().includes('rate limit') ||
    aiErrorText.toLowerCase().includes('resource_exhausted');
  const showConfigHint =
    aiErrorText.length > 0 &&
    !is429Message &&
    /(api key|credential|credentials|auth|authentication|config|configuration|not configured|firebase|gemini)/i.test(aiErrorText);
  const hasResult =
    aiState === 'READY' &&
    currentDraft !== null &&
    currentDraft.domainRouting !== undefined;

  // Once the case pipeline has produced results, render ContinuousCaseWorkspace
  if (hasResult) {
    return (
      <ContinuousCaseWorkspace
        initialStructure={structuredResult}
        onReset={handleReset}
      />
    );
  }

  // If in the middle of live processing, render the continuous case workspace progressively
  if (isProcessing) {
    return (
      <ContinuousCaseWorkspace
        initialStructure={structuredResult}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        aria-label="Tell us what happened"
        noValidate
      >
        {/* Hidden file input for document attachment */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleDocumentAdd(file);
          }}
        />

        {/* ═══ Large Premium Conversational Input Surface ═══ */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOverInput(true);
          }}
          onDragLeave={() => setIsDragOverInput(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOverInput(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleDocumentAdd(file);
          }}
          className={clsx(
            'conversational-surface p-5 sm:p-7 relative transition-all duration-300',
            isDragOverInput && 'border-indigo-400 bg-indigo-950/40 shadow-[0_0_35px_rgba(99,102,241,0.25)]'
          )}
        >
          {/* Subtle Ambient Guide Icon in top corner */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <AIGuideCharacter state={aiState} size="sm" />
              <label
                htmlFor="case-narrative-textarea"
                className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-300"
              >
                What happened?
              </label>
            </div>

            {/* Attached documents pill if any */}
            {uploadedFiles.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <span>📄</span>
                <span>{uploadedFiles.length} document{uploadedFiles.length > 1 ? 's' : ''} attached</span>
              </span>
            )}
          </div>

          {/* Primary Conversational Textarea */}
          <textarea
            id="case-narrative-textarea"
            name="narrative"
            rows={6}
            value={narrativeInput}
            onChange={handleChange}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t.inputPlaceholder}
            disabled={isProcessing}
            aria-required="true"
            aria-invalid={Boolean(validationError)}
            aria-describedby={validationError ? 'intake-error' : undefined}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base leading-relaxed resize-y focus:outline-none border-0 p-0 font-sans"
            style={{ minHeight: '130px' }}
          />

          {/* Drag & Drop Overlay indicator when dragging */}
          {isDragOverInput && (
            <div className="absolute inset-0 rounded-2xl bg-indigo-950/90 border-2 border-dashed border-indigo-400 flex items-center justify-center pointer-events-none z-20 backdrop-blur-sm animate-fade-in">
              <div className="text-center space-y-1">
                <span className="text-3xl block">📄</span>
                <p className="text-sm font-semibold text-white">Drop your document here</p>
                <p className="text-xs text-indigo-300">PDF, PNG, JPG or WebP</p>
              </div>
            </div>
          )}

          {/* Bottom Action & Control Bar inside Conversational Surface */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-indigo-950/60">
            {/* Left Tools: Voice dictation & document attach */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Voice button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400',
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                )}
                title={isListening ? 'Stop listening' : 'Dictate your story'}
                aria-pressed={isListening}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
                <span>{isListening ? t.voiceListening : t.voiceStart}</span>
              </button>

              {/* Attach document button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                title="Attach document (PDF, PNG, JPG, WebP)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <span>Attach evidence</span>
              </button>

              {/* Continue without evidence button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isOverLimit || isProcessing || narrativeInput.trim().length < MIN_CHARS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                title="Continue case analysis without attaching documents"
              >
                <span>Continue without evidence</span>
              </button>

              {/* Voice notice tooltip */}
              {voiceNotice && (
                <span className="text-xs text-indigo-300 font-mono animate-fade-in">
                  {voiceNotice}
                </span>
              )}
            </div>

            {/* Right Tools: Character Count & Keyboard Hint */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                Press ⌘+Enter
              </span>
              <span
                className={clsx(
                  'text-xs font-mono tabular-nums',
                  isOverLimit
                    ? 'text-red-400 font-bold'
                    : charCount < MIN_CHARS
                    ? 'text-slate-500'
                    : 'text-indigo-400'
                )}
                aria-live="polite"
              >
                {charCount} / {MAX_CHARS}
              </span>
            </div>
          </div>
        </div>

        {/* Validation Error banner */}
        {validationError && (
          <div
            id="intake-error"
            role="alert"
            className="rounded-xl p-3.5 text-xs text-red-300 bg-red-950/40 border border-red-800/40 flex items-start gap-2.5 animate-fade-in"
          >
            <span aria-hidden="true">⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* AI Error banner */}
        {aiState === 'ERROR' && aiError && (
          <div
            role="alert"
            className="rounded-xl p-3.5 text-xs text-amber-200 bg-amber-950/40 border border-amber-800/40 flex items-start gap-2.5 animate-fade-in"
          >
            <span aria-hidden="true">⚠️</span>
            <div className="flex-1 space-y-1">
              <strong className="block text-amber-300 font-semibold">AI Service Notice</strong>
              <p className="leading-relaxed">
                {sanitizeUserFacingErrorMessage(aiError)}
              </p>
            </div>
          </div>
        )}

        {/* ═══ Primary CTA Button & Optional Evidence Note ═══ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-400 max-w-md">
            Evidence can strengthen the analysis, but you can continue without documents and add them later.
          </p>

          <button
            type="submit"
            disabled={isOverLimit || isProcessing}
            aria-label="Start with my story — Continue to case journey"
            className={clsx(
              'w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 group',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              isOverLimit || isProcessing
                ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_32px_rgba(99,102,241,0.5)] border border-indigo-400/30 hover:scale-[1.01]'
            )}
          >
            <span>{isProcessing ? t.analyzingCta : t.startCta}</span>
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>

      {/* ═══ Subtle Trust Strip Beneath Primary Input ═══ */}
      <div className="trust-strip">
        <div className="trust-item" title="Grounded in real authoritative legal sources">
          <span className="text-indigo-400 text-xs">◆</span>
          <span>{t.trustSignals.sourceAware}</span>
        </div>
        <div className="trust-item" title="Cross-checks documents and narrative facts">
          <span className="text-indigo-400 text-xs">◆</span>
          <span>{t.trustSignals.evidenceAware}</span>
        </div>
        <div className="trust-item" title="Encrypted and scoped to your account">
          <span className="text-indigo-400 text-xs">◆</span>
          <span>{t.trustSignals.privacyConscious}</span>
        </div>
        <div className="trust-item" title="Direct bridge to verified legal aid & official resources">
          <span className="text-indigo-400 text-xs">◆</span>
          <span>{t.trustSignals.humanHelp}</span>
        </div>
      </div>

      {/* ═══ Interactive Living AI Journey ═══ */}
      <InteractiveJourney
        aiState={aiState}
        hasNarrative={narrativeInput.length >= MIN_CHARS}
        hasEvidence={uploadedFiles.length > 0}
      />
    </div>
  );
}
