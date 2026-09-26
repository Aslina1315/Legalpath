'use client';

import React, { useState, useCallback } from 'react';
import { useCaseStore } from '@/store/useCaseStore';
import { useAppStore } from '@/store/useAppStore';
import { runDocumentGeneration } from '@/lib/ai/documentGeneratorModule';
import { runBeforeSendReview } from '@/lib/ai/beforeSendReviewModule';
import type {
  DocumentType,
  DocumentDraftResult,
  DocumentSectionCategory,
} from '@/types/ai';

interface DocumentGeneratorCardProps {
  onDocumentGenerated?: (doc: DocumentDraftResult) => void;
}

const DOCUMENT_TYPE_OPTIONS: Array<{
  id: DocumentType;
  title: string;
  description: string;
}> = [
  {
    id: 'pre_action_representation',
    title: 'Pre-Action Representation',
    description: 'Formal letter setting out facts, applicable statutory provisions, and timeline before court or tribunal action.',
  },
  {
    id: 'demand_letter',
    title: 'Demand / Request Notice',
    description: 'Assertive formal request for deposit return, repair remedy, or fulfillment of contractual duties.',
  },
  {
    id: 'formal_complaint',
    title: 'Formal Complaint',
    description: 'Structured complaint for submission to higher management, ombudsman, or regulatory body.',
  },
  {
    id: 'information_request',
    title: 'Statutory Information Request',
    description: 'Formal request for accounting, itemized deduction breakdown, or relevant records under applicable rules.',
  },
];

const CATEGORY_STYLES: Record<
  DocumentSectionCategory,
  { label: string; bg: string; text: string; border: string; borderLeft: string }
> = {
  USER_PROVIDED_FACT: {
    label: 'USER-PROVIDED FACT',
    bg: 'bg-indigo-950/40',
    text: 'text-indigo-300',
    border: 'border-indigo-800/50',
    borderLeft: 'border-l-indigo-400',
  },
  VERIFIED_SOURCE_INFO: {
    label: 'VERIFIED SOURCE INFORMATION',
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
    border: 'border-sky-800/50',
    borderLeft: 'border-l-sky-400',
  },
  AI_GENERATED_WORDING: {
    label: 'AI-GENERATED WORDING',
    bg: 'bg-slate-900/60',
    text: 'text-slate-300',
    border: 'border-slate-800/60',
    borderLeft: 'border-l-slate-500',
  },
  UNCERTAIN_OR_MISSING: {
    label: 'UNCERTAIN / MISSING INFORMATION',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    border: 'border-amber-800/60',
    borderLeft: 'border-l-amber-400',
  },
};

export const DocumentGeneratorCard: React.FC<DocumentGeneratorCardProps> = ({
  onDocumentGenerated,
}) => {
  const {
    currentDraft,
    generatedDocument,
    setGeneratedDocument,
    updateDocumentSection,
    beforeSendReview,
    setBeforeSendReview,
    userConfirmedDocument,
    setUserConfirmedDocument,
    uploadedFiles,
  } = useCaseStore();

  const { setAIState } = useAppStore();

  const [selectedType, setSelectedType] = useState<DocumentType>('pre_action_representation');
  const [recipientTitle, setRecipientTitle] = useState('Landlord / Managing Agent');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!currentDraft) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setAIState('PLANNING');

    try {
      const facts = currentDraft.structuredFacts?.map((f) => f.text) || [];
      const sources = currentDraft.knowledgeRetrieval?.sources || [];
      const gaps = currentDraft.evidenceGaps?.gaps.map((g) => g.description) || [];
      const jurisdiction = currentDraft.domainRouting?.jurisdiction || currentDraft.jurisdiction || 'Detected Jurisdiction';

      const res = await runDocumentGeneration({
        documentType: selectedType,
        jurisdiction,
        userProvidedFacts: facts,
        verifiedSources: sources,
        actionPath: currentDraft.actionPath,
        unresolvedGaps: gaps,
        recipientRoleOrTitle: recipientTitle,
        narrativeContext: currentDraft.narrative,
      });

      setGeneratedDocument(res.data);
      onDocumentGenerated?.(res.data);
      setBeforeSendReview(null); // Reset review for new document
      setUserConfirmedDocument(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate document');
    } finally {
      setIsGenerating(false);
      setAIState('READY');
    }
  }, [
    currentDraft,
    selectedType,
    recipientTitle,
    setGeneratedDocument,
    onDocumentGenerated,
    setBeforeSendReview,
    setUserConfirmedDocument,
    setAIState,
  ]);

  // Handle Before-You-Send Review pass
  const handleRunReview = useCallback(async () => {
    if (!generatedDocument || !currentDraft) return;
    setIsReviewing(true);
    setErrorMessage(null);
    setAIState('VERIFYING');

    try {
      const facts = currentDraft.structuredFacts?.map((f) => f.text) || [];
      const sources = currentDraft.knowledgeRetrieval?.sources || [];
      const evidenceDescriptions = uploadedFiles.map((f) => `${f.name}: ${f.mimeType}`);
      const jurisdiction = currentDraft.domainRouting?.jurisdiction || currentDraft.jurisdiction || 'Detected Jurisdiction';

      const res = await runBeforeSendReview({
        documentDraft: generatedDocument,
        caseFacts: facts,
        verifiedSources: sources,
        jurisdiction,
        evidenceDescriptions,
        narrativeContext: currentDraft.narrative,
      });

      setBeforeSendReview(res.data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Before-You-Send Review failed');
    } finally {
      setIsReviewing(false);
      setAIState('READY');
    }
  }, [
    generatedDocument,
    currentDraft,
    uploadedFiles,
    setBeforeSendReview,
    setAIState,
  ]);

  // Export functions
  const buildFullText = useCallback(() => {
    if (!generatedDocument) return '';
    const parts: string[] = [];
    parts.push(`=== ${generatedDocument.title.toUpperCase()} ===`);
    parts.push(`Jurisdiction: ${generatedDocument.jurisdiction}`);
    parts.push(`Recipient: ${generatedDocument.recipientRoleOrTitle}`);
    parts.push(`Generated: ${new Date(generatedDocument.generatedAt).toLocaleString()}`);
    parts.push('');
    parts.push(`--- NOTICE ---`);
    parts.push(generatedDocument.formalNoticeDisclaimer);
    parts.push(generatedDocument.aiGeneratedWordingNotice);
    parts.push('');

    generatedDocument.sections.forEach((sec) => {
      parts.push(`[${sec.heading.toUpperCase()}]`);
      parts.push(`Classification: ${sec.category}`);
      if (sec.sourceRef) parts.push(`Authority: ${sec.sourceRef}`);
      parts.push(sec.content);
      parts.push('');
    });

    if (generatedDocument.uncertainOrMissingInformation.length > 0) {
      parts.push(`--- ITEMS NEEDING SENDER VERIFICATION ---`);
      generatedDocument.uncertainOrMissingInformation.forEach((item) => {
        parts.push(`• ${item}`);
      });
      parts.push('');
    }

    return parts.join('\n');
  }, [generatedDocument]);

  const handleCopy = useCallback(() => {
    const text = buildFullText();
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  }, [buildFullText]);

  const handleDownload = useCallback(() => {
    const text = buildFullText();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDocument?.documentType || 'formal-document'}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [buildFullText, generatedDocument]);

  const isBlocked = beforeSendReview?.verdict === 'BLOCKED';
  const canExport = !!generatedDocument && userConfirmedDocument && !isBlocked;

  return (
    <section
      className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl space-y-6 animate-fade-in"
      aria-labelledby="doc-generator-heading"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 font-mono text-sm">
            11
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="doc-generator-heading" className="text-lg font-semibold text-white">
                Prepare a Document
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-violet-950/50 text-violet-300 border border-violet-800/50">
                AI DRAFT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Prepare a formal document grounded strictly in verified case facts and statutory citations
            </p>
          </div>
        </div>

        {generatedDocument && (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            DRAFT GENERATED
          </span>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Optional evidence guidance */}
      {uploadedFiles.length === 0 && (
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-center gap-2">
          <span className="text-sm">💡</span>
          <span>Consider attaching supporting evidence before sending. You can draft immediately using your narrative and verified sources.</span>
        </div>
      )}

      {/* Configuration & Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Document Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedType(opt.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedType === opt.id
                    ? 'bg-violet-950/30 border-violet-500/70 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">
                      {opt.title}
                    </span>
                    {selectedType === opt.id && (
                      <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label
              htmlFor="recipient-input"
              className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1"
            >
              Addressed To (Role or Title)
            </label>
            <input
              id="recipient-input"
              type="text"
              value={recipientTitle}
              onChange={(e) => setRecipientTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Landlord / Property Manager / Legal Department"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Preparing Document…</span>
                </>
              ) : (
                <>
                  <span>📝</span>
                  <span>Prepare Draft Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Document Display */}
      {generatedDocument && (
        <div className="mt-6 space-y-6 pt-6 border-t border-slate-800 animate-fade-in">
          {/* Document Header & Trust Notice */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-bold text-white tracking-tight">
                {generatedDocument.title}
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Jurisdiction: {generatedDocument.jurisdiction}
              </span>
            </div>
            <p className="text-xs text-amber-300/90 leading-relaxed font-mono">
              ⚠️ {generatedDocument.formalNoticeDisclaimer}
            </p>
            <p className="text-[11px] text-slate-400">
              {generatedDocument.aiGeneratedWordingNotice}
            </p>
          </div>

          {/* Classification Legend */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              Color-Coded Information Categorization
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_STYLES).map(([catKey, style]) => (
                <span
                  key={catKey}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium ${style.bg} ${style.text} border ${style.border}`}
                >
                  {style.label}
                </span>
              ))}
            </div>
          </div>

          {/* Editable Sections List */}
          <div className="space-y-4">
            {generatedDocument.sections.map((sec) => {
              const style = CATEGORY_STYLES[sec.category] || CATEGORY_STYLES.AI_GENERATED_WORDING;
              return (
                <div
                  key={sec.id}
                  className={`p-4 rounded-xl border border-l-4 ${style.border} ${style.borderLeft} bg-slate-900/60 space-y-2`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {sec.heading}
                    </h5>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${style.bg} ${style.text} border ${style.border}`}
                    >
                      {style.label}
                    </span>
                  </div>

                  {sec.sourceRef && (
                    <p className="text-[11px] font-mono text-sky-400">
                      Authority: {sec.sourceRef}
                    </p>
                  )}

                  <textarea
                    rows={Math.max(3, Math.ceil(sec.content.length / 80))}
                    value={sec.content}
                    onChange={(e) => updateDocumentSection(sec.id, e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 text-xs sm:text-sm font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-violet-500"
                    aria-label={`Edit ${sec.heading}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Missing Information / Verification Warnings */}
          {generatedDocument.uncertainOrMissingInformation.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2">
              <span className="text-xs font-mono font-semibold uppercase text-amber-400 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Uncertain or Missing Information to Verify Before Delivery</span>
              </span>
              <ul className="space-y-1 pl-4 list-disc text-xs text-amber-200/90">
                {generatedDocument.uncertainOrMissingInformation.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* PHASE 3: BEFORE-YOU-SEND PRE-FLIGHT REVIEW                    */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                    Step 12 · Before-You-Send Verification
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Independent pre-flight check across factual consistency, contradictions, and unsupported legal claims
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunReview}
                disabled={isReviewing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors shadow flex items-center justify-center gap-2 shrink-0"
              >
                {isReviewing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Running Verification…</span>
                  </>
                ) : (
                  <>
                    <span>🛡️</span>
                    <span>Run Before-You-Send Review</span>
                  </>
                )}
              </button>
            </div>

            {/* Review Results Display */}
            {beforeSendReview && (
              <div
                className={`p-5 rounded-xl border space-y-4 animate-fade-in ${
                  beforeSendReview.verdict === 'READY'
                    ? 'bg-emerald-950/30 border-emerald-600/50'
                    : beforeSendReview.verdict === 'NEEDS_REVIEW'
                    ? 'bg-amber-950/30 border-amber-600/50'
                    : 'bg-rose-950/30 border-rose-600/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {beforeSendReview.verdict === 'READY'
                        ? '✅'
                        : beforeSendReview.verdict === 'NEEDS_REVIEW'
                        ? '⚠️'
                        : '🛑'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                        beforeSendReview.verdict === 'READY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : beforeSendReview.verdict === 'NEEDS_REVIEW'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      Verdict: {beforeSendReview.verdict.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Checked {new Date(beforeSendReview.reviewedAt).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {beforeSendReview.summary}
                </p>

                {/* Categorical Checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Pre-Flight Checklist Inspection (No Misleading Numeric Score)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {beforeSendReview.checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          item.passed
                            ? 'bg-slate-900/60 border-emerald-900/40 text-emerald-200'
                            : item.severity === 'CRITICAL'
                            ? 'bg-rose-950/50 border-rose-800/60 text-rose-200'
                            : 'bg-amber-950/50 border-amber-800/60 text-amber-200'
                        }`}
                      >
                        <span className="shrink-0 mt-0.5">
                          {item.passed ? '✓' : item.severity === 'CRITICAL' ? '🛑' : '⚠️'}
                        </span>
                        <div className="space-y-0.5">
                          <strong className="block font-medium">{item.label}</strong>
                          <p className="text-[11px] opacity-90">{item.details}</p>
                          {item.remediation && (
                            <p className="text-[10px] font-mono text-amber-300 mt-1">
                              Action: {item.remediation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blockers list if any */}
                {beforeSendReview.blockers.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700 text-xs text-rose-200 space-y-1">
                    <strong className="block font-semibold">Critical Blockers (Export Restricted):</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {beforeSendReview.blockers.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* User Confirmation Checkbox */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userConfirmedDocument}
                  onChange={(e) => setUserConfirmedDocument(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-xs text-slate-300 leading-relaxed select-none">
                  <strong>Explicit Sender Confirmation:</strong> I have personally reviewed each factual statement
                  and confirmed that all dates, amounts, and accounts accurately reflect my own situation. I understand
                  that this AI assistant is not a lawyer and has not provided legal representation.
                </span>
              </label>

              {isBlocked && (
                <p className="text-xs text-rose-400 font-mono">
                  🛑 Export is currently blocked by the Before-You-Send verification pass. Please resolve critical discrepancies before proceeding.
                </p>
              )}
            </div>

            {/* Export Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!canExport}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>{copyFeedback ? '✓ Copied' : '📋 Copy Clean Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!canExport}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5 shadow"
              >
                <span>📥 Download Draft (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                disabled={!canExport}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>🖨️ Print / PDF</span>
              </button>

              {!userConfirmedDocument && (
                <span className="text-[11px] text-slate-500 italic">
                  (Check confirmation box above to enable export)
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
