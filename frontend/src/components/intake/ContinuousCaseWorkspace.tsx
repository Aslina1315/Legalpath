'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCaseStore } from '@/store/useCaseStore';
import { AIGuideCharacter } from '@/components/ui/AIGuideCharacter';
import { DomainCard } from './DomainCard';
import { KnowledgeSourcesCard } from './KnowledgeSourcesCard';
import { EvidenceUploaderCard } from './EvidenceUploaderCard';
import { EvidenceGapsCard } from './EvidenceGapsCard';
import { ContradictionsCard } from './ContradictionsCard';
import { VerifiedGuidanceCard } from './VerifiedGuidanceCard';
import { ActionPathCard } from './ActionPathCard';
import { SaveCasePrompt } from './SaveCasePrompt';
import { CaseStructureCard } from './CaseStructureCard';

import { runEvidenceAnalysis, type UploadedEvidenceFile } from '@/lib/ai/evidenceAnalyzerModule';
import { runEvidenceGapDetection } from '@/lib/ai/evidenceGapModule';
import { runContradictionDetection } from '@/lib/ai/contradictionModule';
import { runResponseVerification } from '@/lib/ai/responseVerifierModule';
import { runActionPathPlan } from '@/lib/ai/actionPathModule';

import type {
  CaseStructureResult,
} from '@/lib/ai/schemas';

interface ContinuousCaseWorkspaceProps {
  initialStructure?: CaseStructureResult;
  onReset?: () => void;
}

export const ContinuousCaseWorkspace: React.FC<ContinuousCaseWorkspaceProps> = ({
  initialStructure,
  onReset,
}) => {
  const { aiState, setAIState, aiError, setAIError } = useAppStore();
  const {
    currentDraft,
    updateDraft,
    uploadedFiles,
    addUploadedFile,
    userClarifications,
    setUserClarification,
  } = useCaseStore();

  const [activeStepMessage, setActiveStepMessage] = useState<string>(
    'Case analyzed. Synthesizing cross-module insights…'
  );

  // Re-run downstream synthesis (Gaps, Contradictions, Verification, Action Path)
  const runDownstreamPipeline = useCallback(
    async (
      structureData: CaseStructureResult,
      evidenceList: UploadedEvidenceFile[],
      clarifications: Record<string, string>
    ) => {
      try {
        const narrative = currentDraft?.narrative || '';
        const domainData = currentDraft?.domainRouting;
        const retrievalData = currentDraft?.knowledgeRetrieval;

        // 1. Evidence Analysis for any uploaded files that haven't been analyzed
        const analyzedEvidenceResults = [];
        for (const file of evidenceList) {
          if (file.analysisResult) {
            analyzedEvidenceResults.push(file.analysisResult);
          } else {
            setAIState('ANALYZING');
            setActiveStepMessage(`Analyzing document: ${file.name}…`);
            const analysisRes = await runEvidenceAnalysis(file);
            file.analysisResult = analysisRes.data;
            analyzedEvidenceResults.push(analysisRes.data);
          }
        }

        // 2. Module 07: Evidence Gaps
        setAIState('COMPARING');
        setActiveStepMessage('Auditing case for evidence gaps and missing documentation…');
        const gapsRes = await runEvidenceGapDetection({
          narrative,
          structure: structureData,
          evidence: analyzedEvidenceResults,
          retrievedKnowledge: retrievalData,
        });

        // 3. Module 08: Contradictions
        setActiveStepMessage('Detecting discrepancies between statements and documents…');
        const contradictionsRes = await runContradictionDetection({
          narrative,
          structure: structureData,
          evidence: analyzedEvidenceResults,
          userClarifications: clarifications,
        });

        // 4. Module 09: Response Verification
        setAIState('VERIFYING');
        setActiveStepMessage('Verifying factual and legal claims against retrieved sources…');
        const draftGuidance = `Assessment for ${domainData?.domain || 'legal matter'} in ${
          domainData?.jurisdiction || 'detected jurisdiction'
        }: Based on facts and retrieved authorities, procedural requirements apply.`;

        const verificationRes = await runResponseVerification({
          draftResponse: draftGuidance,
          retrievedKnowledge: retrievalData,
          structuredFacts: structureData.structuredFacts,
          jurisdiction: domainData?.jurisdiction,
        });

        // 5. Module 10: Action Path
        setAIState('PLANNING');
        setActiveStepMessage('Constructing prioritized actionable roadmap…');
        const actionPathRes = await runActionPathPlan({
          currentSituation: verificationRes.data.verifiedSummary,
          verifiedClaims: verificationRes.data.claims,
          evidenceGaps: gapsRes.data,
          contradictions: contradictionsRes.data,
          domain: domainData?.domain,
          jurisdiction: domainData?.jurisdiction,
        });

        // Update state in draft
        updateDraft({
          evidenceGaps: gapsRes.data,
          contradictions: contradictionsRes.data,
          responseVerification: verificationRes.data,
          actionPath: actionPathRes.data,
          status: 'ACTIONABLE',
        });

        setAIState('READY');
        setActiveStepMessage('Analysis complete. All insights verified.');
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

  const isWorking =
    aiState !== 'IDLE' && aiState !== 'READY' && aiState !== 'ERROR';

  return (
    <div className="space-y-8 animate-fade-in" aria-label="Case Workspace">
      {/* Top AI Guide Bar */}
      <section
        className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl"
        aria-live="polite"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            <AIGuideCharacter state={aiState} size="lg" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Continuous AI Guide
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-cyan-300 border border-slate-700">
                {aiState}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isWorking ? 'Processing Your Case Journey' : 'Case Workspace Active'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isWorking ? activeStepMessage : 'Continuous legal intelligence assembled. Review insights and next steps below.'}
            </p>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
            >
              Start New Case
            </button>
          )}
        </div>
      </section>

      {/* Error state if occurred */}
      {aiError && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm flex items-start gap-3">
          <span className="text-rose-400 text-lg">⚠️</span>
          <div className="flex-1">
            <strong className="block text-rose-300 font-semibold mb-1">Processing Note</strong>
            <p className="text-xs text-rose-200/90 leading-relaxed">{aiError}</p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. What We Understood & Structured Case (Modules 01 & 02)                */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Step 1 · Situation Understanding & Structure
        </div>

        {currentDraft?.narrative && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-sm">
            <h3 className="text-xs uppercase font-mono font-semibold text-slate-400 mb-2">Original Narrative</h3>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{currentDraft.narrative}</p>
          </div>
        )}

        {initialStructure && (
          <CaseStructureCard structure={initialStructure} generatedAt={new Date().toISOString()} />
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. Legal Domain & Jurisdiction (Module 03)                                */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {currentDraft?.domainRouting && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Step 2 · Legal Domain & Jurisdiction
          </div>
          <DomainCard domain={currentDraft.domainRouting} />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. Live Grounded Legal Knowledge (Module 05)                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {currentDraft?.knowledgeRetrieval && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Step 3 · Live Grounded Authorities (Google Search)
          </div>
          <KnowledgeSourcesCard retrieval={currentDraft.knowledgeRetrieval} />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 4. Evidence Uploader & Analysis (Module 06)                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Step 4 · Evidence Analysis (PDF, Images)
        </div>
        <EvidenceUploaderCard onEvidenceAnalyzed={handleEvidenceUploaded} />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 5. Evidence Gaps (Module 07)                                             */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {currentDraft?.evidenceGaps && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Step 5 · Evidence Gap Audit
          </div>
          <EvidenceGapsCard gapResult={currentDraft.evidenceGaps} />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 6. Contradictions & User Clarification (Module 08)                       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {currentDraft?.contradictions && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Step 6 · Contradiction Resolution
          </div>
          <ContradictionsCard
            contradictionResult={currentDraft.contradictions}
            userClarifications={userClarifications}
            onClarificationSubmit={handleClarificationSubmit}
          />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 7. Verified Guidance & Trust Layer (Module 09)                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {currentDraft?.responseVerification && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            Step 7 · Verified Findings & Claims
          </div>
          <VerifiedGuidanceCard verification={currentDraft.responseVerification} />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 8. Action Path Roadmap (Module 10)                                       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {currentDraft?.actionPath && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Step 8 · Your Action Path
          </div>
          <ActionPathCard actionPath={currentDraft.actionPath} />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 9. Save Case Prompt                                                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {currentDraft && <SaveCasePrompt draft={currentDraft} />}
    </div>
  );
};
