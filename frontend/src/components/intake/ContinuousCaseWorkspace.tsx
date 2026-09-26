/**
 * ContinuousCaseWorkspace — The unified, continuous legal case experience.
 *
 * Core Principles:
 *   ONE CONTINUOUS EXPERIENCE.
 *   Progressive revealing of 7 real-time intelligence sections:
 *     1. WHAT WE UNDERSTOOD (Summary, entities, key facts, timeline)
 *     2. WHERE THIS MAY FIT (Domain, jurisdiction, confidence, missing information)
 *     3. WHAT THE CURRENT SOURCES SAY (Source title, publisher, citation, retrieval status, concise explanation)
 *     4. YOUR EVIDENCE (Upload area, analyzed documents, extracted facts)
 *     5. WHAT NEEDS ATTENTION (Evidence gaps, contradictions, clarification requests)
 *     6. VERIFIED INFORMATION (Supported, partially supported, uncertain — trust layer)
 *     7. YOUR NEXT STEPS (Roadmap, documents needed, document preparation, human help bridge)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCaseStore } from '@/store/useCaseStore';
import { AIGuideCharacter } from '@/components/ui/AIGuideCharacter';
import { LivePipelineProgress } from './LivePipelineProgress';
import { InteractiveJourney } from './InteractiveJourney';
import { DomainCard } from './DomainCard';
import { KnowledgeSourcesCard } from './KnowledgeSourcesCard';
import { EvidenceUploaderCard } from './EvidenceUploaderCard';
import { EvidenceGapsCard } from './EvidenceGapsCard';
import { ContradictionsCard } from './ContradictionsCard';
import { VerifiedGuidanceCard } from './VerifiedGuidanceCard';
import { ActionPathCard } from './ActionPathCard';
import { SaveCasePrompt } from './SaveCasePrompt';
import { CaseStructureCard } from './CaseStructureCard';
import { DocumentGeneratorCard } from './DocumentGeneratorCard';
import { HumanHelpBridgeCard } from './HumanHelpBridgeCard';
import { getTranslation } from '@/lib/i18n';
import { deleteCase } from '@/lib/firebase/firestore';

import { runEvidenceAnalysis, type UploadedEvidenceFile } from '@/lib/ai/evidenceAnalyzerModule';
import { runTrustAndAction } from '@/lib/ai/trustAndActionModule';

import type { CaseStructureResult, CaseUnderstandingResult } from '@/lib/ai/schemas';
import type { KnowledgeRetrievalResult } from '@/types/ai';

interface ContinuousCaseWorkspaceProps {
  initialStructure?: CaseStructureResult;
  onReset?: () => void;
}

export const ContinuousCaseWorkspace: React.FC<ContinuousCaseWorkspaceProps> = ({
  initialStructure,
  onReset,
}) => {
  const { aiState, setAIState, aiError, setAIError, language } = useAppStore();
  const t = getTranslation(language);
  const {
    currentDraft,
    updateDraft,
    uploadedFiles,
    addUploadedFile,
    userClarifications,
    setUserClarification,
    caseId,
    setCaseId,
    clearDraft,
  } = useCaseStore();

  const [activeStepMessage, setActiveStepMessage] = useState<string>(
    'Understanding situation & organizing legal intelligence…'
  );

  // Re-run downstream synthesis with new evidence (calls at most 2 Gemini operations)
  const runDownstreamPipeline = useCallback(
    async (
      structureData: CaseStructureResult,
      evidenceList: UploadedEvidenceFile[],
      clarifications: Record<string, string>
    ) => {
      try {
        const narrative = currentDraft?.narrative || '';
        const domainData = currentDraft?.domainRouting;
        const retrievalData: KnowledgeRetrievalResult = currentDraft?.knowledgeRetrieval || {
          status: 'no_verified_source',
          queryUsed: '',
          keyFindings: [],
          sources: [],
          applicableRules: [],
          limitations: [],
        };

        // 1. Evidence Analysis for any uploaded files that haven't been analyzed
        const analyzedEvidenceResults = [];
        for (const file of evidenceList) {
          if (file.analysisResult) {
            analyzedEvidenceResults.push(file.analysisResult);
          } else {
            setAIState('ANALYZING');
            setActiveStepMessage(`Analyzing document: ${file.name}…`);
            const analysisRes = await runEvidenceAnalysis(file, narrative);
            file.analysisResult = analysisRes.data;
            analyzedEvidenceResults.push(analysisRes.data);
          }
        }

        // 2. Trust & Action Synthesis (single consolidated call)
        setAIState('VERIFYING');
        setActiveStepMessage('Updating evidence gaps, contradictions, verification, and action path…');

        const caseUnderstandingData: CaseUnderstandingResult = {
          summary: narrative.slice(0, 200),
          structuredFacts: structureData.structuredFacts,
          entities: structureData.entities,
          timeline: structureData.timeline,
          domain: domainData?.domain || 'General Legal Matter',
          subDomain: domainData?.subDomain || undefined,
          domainConfidence: domainData?.jurisdictionConfidence || 0.9,
          jurisdiction: domainData?.jurisdiction ?? null,
          jurisdictionConfidence: domainData?.jurisdictionConfidence || 0.8,
          missingInformation: domainData?.missingInformation || [],
          urgencySignals: domainData?.urgencySignals || [],
          urgencyLevel: 'MEDIUM',
          initialEvidenceGaps: structureData.evidenceMissing,
        };

        const trustRes = await runTrustAndAction({
          caseUnderstanding: caseUnderstandingData,
          retrievedKnowledge: retrievalData,
          evidence: analyzedEvidenceResults,
          userClarifications: clarifications,
        });
        const trustData = trustRes.data;

        // Update state in draft in place (user does not restart case!)
        updateDraft({
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
                ? 'Identified potential contradictions between statements and evidence.'
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
        });

        setAIState('READY');
        setActiveStepMessage('Analysis complete. All insights updated with new evidence.');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Downstream pipeline processing error';
        setAIError(msg);
      }
    },
    [currentDraft, updateDraft, setAIState, setAIError]
  );

  // Handle new evidence uploaded
  const handleEvidenceUploaded = useCallback(
    async (file: UploadedEvidenceFile) => {
      addUploadedFile(file);
      if (initialStructure) {
        await runDownstreamPipeline(initialStructure, [...uploadedFiles, file], userClarifications);
      }
    },
    [addUploadedFile, initialStructure, uploadedFiles, userClarifications, runDownstreamPipeline]
  );

  // Handle user clarification submitted
  const handleClarificationSubmit = useCallback(
    async (key: string, value: string) => {
      setUserClarification(key, value);
      const updatedClarifications = { ...userClarifications, [key]: value };
      if (initialStructure) {
        await runDownstreamPipeline(initialStructure, uploadedFiles, updatedClarifications);
      }
    },
    [setUserClarification, userClarifications, initialStructure, uploadedFiles, runDownstreamPipeline]
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isWorking =
    aiState !== 'IDLE' && aiState !== 'READY' && aiState !== 'ERROR';

  // Feature 17: Follow-up Intelligence State
  let followUpMessage: string | null = null;
  let followUpAction: { label: string; onClick: () => void } | null = null;

  const unresolvedContradiction = currentDraft?.contradictions?.contradictions?.find(
    (c) => !userClarifications[c.id]
  );
  const pendingActionSteps = currentDraft?.actionPath?.nextSteps?.filter(
    (s) => s.status !== 'COMPLETED'
  );
  const allActionStepsCompleted =
    currentDraft?.actionPath?.nextSteps &&
    currentDraft.actionPath.nextSteps.length > 0 &&
    currentDraft.actionPath.nextSteps.every((s) => s.status === 'COMPLETED');

  if (unresolvedContradiction) {
    followUpMessage = t.followUp.clarificationNeeded;
    followUpAction = {
      label: 'Review Clarification',
      onClick: () => scrollToSection('sec-attention'),
    };
  } else if (currentDraft?.generatedDocument && !currentDraft?.beforeSendReview) {
    followUpMessage = t.followUp.draftReady;
    followUpAction = {
      label: 'Review Draft',
      onClick: () => scrollToSection('sec-action'),
    };
  } else if (pendingActionSteps && pendingActionSteps.length > 0) {
    followUpMessage = t.followUp.actionStepOpen;
    followUpAction = {
      label: 'View Next Step',
      onClick: () => scrollToSection('sec-action'),
    };
  } else if (allActionStepsCompleted) {
    followUpMessage = t.followUp.pathComplete;
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-4xl mx-auto pb-16" aria-label="Case Workspace">
      {/* ═══ Top AI Command Center ═══ */}
      <section
        className="glass-card-static p-6 sm:p-8 overflow-hidden relative"
        aria-live="polite"
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'var(--gradient-brand)' }}
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            <AIGuideCharacter state={aiState} size="lg" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest font-semibold text-indigo-400">
                AI Legal Intelligence
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold"
                style={{
                  background: isWorking
                    ? 'rgba(99, 102, 241, 0.15)'
                    : aiState === 'ERROR'
                    ? 'rgba(248, 113, 113, 0.15)'
                    : 'rgba(52, 211, 153, 0.12)',
                  color: isWorking
                    ? '#a78bfa'
                    : aiState === 'ERROR'
                    ? '#f87171'
                    : '#34d399',
                  border: `1px solid ${
                    isWorking
                      ? 'rgba(99, 102, 241, 0.25)'
                      : aiState === 'ERROR'
                      ? 'rgba(248, 113, 113, 0.25)'
                      : 'rgba(52, 211, 153, 0.2)'
                  }`,
                }}
              >
                {isWorking && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                  </span>
                )}
                {aiState}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isWorking ? 'Analyzing Your Situation' : 'Case Intelligence Ready'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {isWorking
                ? activeStepMessage
                : 'All modules complete. Review verified insights, authoritative legal rules, and your step-by-step roadmap below.'}
            </p>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-indigo-900/40 transition-colors shrink-0"
            >
              Start New Case
            </button>
          )}
        </div>
      </section>

      {/* ═══ Feature 17: Follow-up Intelligence Banner ═══ */}
      {followUpMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08))',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300">
                In-App Case Follow-Up
              </p>
              <p className="text-sm font-medium text-white mt-0.5">
                {followUpMessage}
              </p>
            </div>
          </div>
          {followUpAction && (
            <button
              type="button"
              onClick={followUpAction.onClick}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0 shadow-sm"
            >
              {followUpAction.label}
            </button>
          )}
        </aside>
      )}

      {/* ═══ Live Pipeline Visualization ═══ */}
      <LivePipelineProgress state={aiState} />

      {/* ═══ Interactive Living Journey ═══ */}
      <InteractiveJourney
        aiState={aiState}
        hasNarrative={Boolean(currentDraft?.narrative)}
        hasEvidence={uploadedFiles.length > 0}
        hasVerification={Boolean(currentDraft?.responseVerification)}
        hasActionPath={Boolean(currentDraft?.actionPath)}
        onStageSelect={(stageId) => {
          const map: Record<string, string> = {
            story: 'sec-understood',
            understand: 'sec-understood',
            research: 'sec-sources',
            evidence: 'sec-evidence',
            verify: 'sec-verified',
            action: 'sec-action',
          };
          if (map[stageId]) scrollToSection(map[stageId]);
        }}
      />

      {/* Processing Note / Error Banner if occurred */}
      {aiError && (
        <div
          role="alert"
          className="p-4 rounded-xl text-xs flex items-start gap-3 bg-red-950/30 border border-red-800/40 text-red-300 animate-fade-in"
        >
          <span className="text-base">⚠️</span>
          <div className="flex-1">
            <strong className="block font-semibold mb-0.5 text-red-200">Processing Note</strong>
            <p className="leading-relaxed">{aiError}</p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 1. WHAT WE UNDERSTOOD (Summary, Entities, Key Facts, Timeline)      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {(currentDraft?.narrative || initialStructure) && (
        <section id="sec-understood" className="space-y-4 card-reveal" aria-labelledby="heading-sec-1">
          <div className="flex items-center gap-2">
            <div className="step-badge">
              <span className="dot" style={{ background: '#818cf8' }}></span>
              Section 1 · What We Understood
            </div>
          </div>

          {currentDraft?.narrative && (
            <div className="glass-card-static p-5 space-y-2">
              <span className="text-[10px] uppercase font-mono font-semibold tracking-widest text-indigo-400 block">
                Original Statement
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                {currentDraft.narrative}
              </p>
            </div>
          )}

          {initialStructure && (
            <CaseStructureCard
              structure={initialStructure}
              generatedAt={currentDraft?.timestamps?.intakeCompletedAt || new Date().toISOString()}
            />
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 2. WHERE THIS MAY FIT (Domain, Jurisdiction, Confidence, Gaps)     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentDraft?.domainRouting && (
        <section id="sec-domain" className="space-y-4 card-reveal" aria-labelledby="heading-sec-2">
          <div className="step-badge">
            <span className="dot" style={{ background: '#6366f1' }}></span>
            Section 2 · Where This May Fit
          </div>
          <DomainCard domain={currentDraft.domainRouting} />
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 3. WHAT THE CURRENT SOURCES SAY (Source title, publisher, rules)     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentDraft?.knowledgeRetrieval && (
        <section id="sec-sources" className="space-y-4 card-reveal" aria-labelledby="heading-sec-3">
          <div className="step-badge">
            <span className="dot" style={{ background: '#22d3ee' }}></span>
            Section 3 · What The Current Sources Say
          </div>
          <KnowledgeSourcesCard retrieval={currentDraft.knowledgeRetrieval} />
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 4. YOUR EVIDENCE (Upload Area, Analyzed Documents, Extracted Facts) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section id="sec-evidence" className="space-y-4 card-reveal" aria-labelledby="heading-sec-4">
        <div className="step-badge">
          <span className="dot" style={{ background: '#fbbf24' }}></span>
          Section 4 · Your Evidence
        </div>
        <EvidenceUploaderCard
          onEvidenceAnalyzed={handleEvidenceUploaded}
          caseNarrative={currentDraft?.narrative}
          isProcessing={isWorking}
        />
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 5. WHAT NEEDS ATTENTION (Evidence Gaps, Contradictions)             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {(currentDraft?.evidenceGaps || currentDraft?.contradictions) && (
        <section id="sec-attention" className="space-y-4 card-reveal" aria-labelledby="heading-sec-5">
          <div className="step-badge">
            <span className="dot" style={{ background: '#f87171' }}></span>
            Section 5 · What Needs Attention
          </div>

          {currentDraft?.evidenceGaps && (
            <EvidenceGapsCard gapResult={currentDraft.evidenceGaps} />
          )}

          {currentDraft?.contradictions && (
            <ContradictionsCard
              contradictionResult={currentDraft.contradictions}
              userClarifications={userClarifications}
              onClarificationSubmit={handleClarificationSubmit}
            />
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 6. VERIFIED INFORMATION (Supported, Partially Supported, Uncertain) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentDraft?.responseVerification && (
        <section id="sec-verified" className="space-y-4 card-reveal" aria-labelledby="heading-sec-6">
          <div className="step-badge">
            <span className="dot" style={{ background: '#34d399' }}></span>
            Section 6 · Verified Information
          </div>
          <VerifiedGuidanceCard verification={currentDraft.responseVerification} />
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 7. YOUR NEXT STEPS (Roadmap, Documents, Human Help Bridge)          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentDraft?.actionPath && (
        <section id="sec-action" className="space-y-6 card-reveal" aria-labelledby="heading-sec-7">
          <div className="step-badge">
            <span className="dot" style={{ background: '#34d399' }}></span>
            Section 7 · Your Next Steps
          </div>

          <ActionPathCard actionPath={currentDraft.actionPath} />

          {/* Human Help Bridge if recommended */}
          {currentDraft.actionPath.humanHelpRecommended && (
            <HumanHelpBridgeCard
              jurisdiction={currentDraft.domainRouting?.jurisdiction ?? currentDraft.jurisdiction ?? undefined}
              reasoning={currentDraft.actionPath.humanHelpReasoning ?? undefined}
              domain={currentDraft.domainRouting?.domain}
            />
          )}

          {/* Document Generator Integrated directly into workspace */}
          <div className="pt-2">
            <DocumentGeneratorCard />
          </div>

          {/* Save Case Prompt & Persistence */}
          <SaveCasePrompt draft={currentDraft} />

          {/* ═══ Feature 20: Case Privacy & Data Controls ═══ */}
          <section
            className="glass-card-static p-6 space-y-4 rounded-2xl"
            style={{ border: '1px solid var(--color-border)' }}
            aria-labelledby="privacy-controls-heading"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <h3
                  id="privacy-controls-heading"
                  className="text-sm font-bold flex items-center gap-2 text-white"
                >
                  <span>🔒</span> {t.privacy.title}
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  {t.privacy.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear the current case draft and return to intake?')) {
                      clearDraft();
                      onReset?.();
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition-colors"
                >
                  {t.privacy.clearDraft}
                </button>

                {caseId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Permanently delete this case record from your private account?')) {
                        try {
                          await deleteCase(caseId);
                          setCaseId(null);
                          clearDraft();
                          onReset?.();
                        } catch (e) {
                          alert('Could not delete case: ' + (e instanceof Error ? e.message : 'Unknown error'));
                        }
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-colors"
                  >
                    {t.privacy.deleteCase}
                  </button>
                )}
              </div>
            </div>
          </section>
        </section>
      )}
    </div>
  );
};
