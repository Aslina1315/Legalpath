/**
 * EvidenceUploaderCard — Premium Multimodal Evidence Analysis Surface (AI Module 06).
 *
 * Features:
 * - Large, tactile drag & drop zone: "Drop a document here", "PDF, PNG, JPG or WebP".
 * - Real upload & analysis sequence:
 *     Uploading → Reading → Extracting → Comparing → Ready
 * - Displays extracted facts in elegant chips & cards:
 *     DATE FOUND, AMOUNT FOUND, PARTY FOUND, CLAUSE FOUND
 * - Displays strictly actual AI results — never invents facts.
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  ALLOWED_EVIDENCE_MIME_TYPES,
  MAX_EVIDENCE_SIZE_BYTES,
  runEvidenceAnalysis,
  type UploadedEvidenceFile,
  type AllowedMimeType,
} from '@/lib/ai/evidenceAnalyzerModule';
import type { EvidenceAnalysisResult } from '@/types/ai';

interface EvidenceUploaderCardProps {
  onAnalysisComplete?: (result: EvidenceAnalysisResult, file: UploadedEvidenceFile) => void;
  onEvidenceAnalyzed?: (file: UploadedEvidenceFile) => Promise<void> | void;
  existingAnalysis?: EvidenceAnalysisResult | null;
  caseNarrative?: string;
  isProcessing?: boolean;
}

type EvidenceStep = 'IDLE' | 'UPLOADING' | 'READING' | 'EXTRACTING' | 'COMPARING' | 'READY';

export const EvidenceUploaderCard: React.FC<EvidenceUploaderCardProps> = ({
  onAnalysisComplete,
  onEvidenceAnalyzed,
  existingAnalysis,
  caseNarrative,
  isProcessing = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState<EvidenceStep>(existingAnalysis ? 'READY' : 'IDLE');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<EvidenceAnalysisResult | null>(
    existingAnalysis || null
  );

  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      // Validate MIME type
      if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(file.type as AllowedMimeType)) {
        setUploadError(
          `Unsupported file type (${file.type || 'unknown'}). Please upload a PDF, PNG, JPG, or WebP document.`
        );
        return;
      }

      // Validate Size (max 10 MB)
      if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
        setUploadError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`
        );
        return;
      }

      setCurrentFileName(file.name);
      setCurrentStep('UPLOADING');

      try {
        // Step 1: Uploading (read file bytes into memory)
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Clean = result.split(',')[1] || result;
            resolve(base64Clean);
          };
          reader.onerror = () => reject(new Error('Failed to read file from disk.'));
          reader.readAsDataURL(file);
        });

        // Step 2: Reading (dispatching to Gemini Multimodal Engine)
        setCurrentStep('READING');
        const uploadedPayload: UploadedEvidenceFile = {
          name: file.name,
          mimeType: file.type,
          base64Data,
          sizeBytes: file.size,
        };

        // Step 3: Extracting (Gemini document facts extraction)
        setCurrentStep('EXTRACTING');
        const response = await runEvidenceAnalysis(uploadedPayload, caseNarrative);
        uploadedPayload.analysisResult = response.data;
        setAnalysisData(response.data);

        // Step 4: Comparing (cross-referencing with workspace)
        setCurrentStep('COMPARING');
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data, uploadedPayload);
        }
        if (onEvidenceAnalyzed) {
          await onEvidenceAnalyzed(uploadedPayload);
        }

        // Step 5: Ready
        setCurrentStep('READY');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Evidence analysis failed. Please try again.';
        setUploadError(msg);
        setCurrentStep('IDLE');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [caseNarrative, onAnalysisComplete, onEvidenceAnalyzed]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const isWorking =
    currentStep === 'UPLOADING' ||
    currentStep === 'READING' ||
    currentStep === 'EXTRACTING' ||
    currentStep === 'COMPARING';

  const sequenceSteps: Array<{ id: EvidenceStep; label: string }> = [
    { id: 'UPLOADING', label: 'Uploading' },
    { id: 'READING', label: 'Reading' },
    { id: 'EXTRACTING', label: 'Extracting' },
    { id: 'COMPARING', label: 'Comparing' },
    { id: 'READY', label: 'Ready' },
  ];

  const currentStepIndex = sequenceSteps.findIndex((s) => s.id === currentStep);

  return (
    <article
      className="glass-card-static animate-fade-in overflow-hidden"
      aria-labelledby="evidence-uploader-heading"
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-widest"
            style={{ color: '#fbbf24' }}
          >
            Module 06 · Multimodal Evidence
          </span>
          <h3
            id="evidence-uploader-heading"
            className="text-sm font-bold mt-0.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Document &amp; Physical Evidence Analysis
          </h3>
        </div>

        {analysisData ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono font-semibold"
            style={{
              background: 'rgba(251, 191, 36, 0.08)',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.2)',
            }}
          >
            ✓ {analysisData.documentType} ({Math.round(analysisData.confidence * 100)}% Confidence)
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono font-semibold"
            style={{
              background: 'rgba(148, 163, 184, 0.08)',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            Evidence not provided yet
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {!analysisData && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between gap-3">
            <span>Evidence not provided yet. Evidence is optional and can be attached at any time to enrich case findings.</span>
          </div>
        )}
        {/* Large Premium Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isWorking && !isProcessing && fileInputRef.current?.click()}
          className={clsx(
            'relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300',
            isDragOver
              ? 'border-indigo-400 bg-indigo-950/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
              : 'border-indigo-900/40 bg-slate-950/40 hover:border-indigo-500/40 hover:bg-slate-900/40',
            (isWorking || isProcessing) && 'pointer-events-none opacity-80'
          )}
          role="button"
          tabIndex={0}
          aria-label="Drop a document here, or click to upload PDF, PNG, JPG or WebP"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            id="evidence-file-input"
            disabled={isWorking || isProcessing}
          />

          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 mb-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>

            <p className="text-base font-semibold text-white">
              Drop a document here
            </p>
            <p className="text-xs text-slate-400">
              PDF, PNG, JPG or WebP · Up to 10 MB
            </p>
            <span className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
              Choose file
            </span>
          </div>
        </div>

        {/* Real Processing Sequence */}
        {isWorking && (
          <div
            className="rounded-xl p-4 bg-slate-900/70 border border-indigo-900/40 space-y-3 animate-fade-in"
            aria-live="polite"
          >
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                Processing {currentFileName}
              </span>
              <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider">
                {currentStep}
              </span>
            </div>

            {/* Sequence step indicators */}
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono pt-1">
              {sequenceSteps.map((seq, idx) => {
                const isPast = currentStepIndex > idx;
                const isCurrent = currentStep === seq.id;

                return (
                  <React.Fragment key={seq.id}>
                    <div
                      className={clsx(
                        'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                        isCurrent
                          ? 'bg-indigo-500/20 text-white font-bold border border-indigo-400/40 animate-pulse'
                          : isPast
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-600'
                      )}
                    >
                      <span>{isPast ? '✓' : isCurrent ? '◉' : '○'}</span>
                      <span className="hidden sm:inline">{seq.label}</span>
                    </div>
                    {idx < sequenceSteps.length - 1 && (
                      <span className="text-slate-600 text-xs">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Error notification */}
        {uploadError && (
          <div className="rounded-xl bg-red-950/30 border border-red-800/40 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <span aria-hidden="true">⚠️</span>
            <div className="flex-1">{uploadError}</div>
          </div>
        )}

        {/* Extracted Facts in Elegant Chips / Cards */}
        {analysisData && (
          <div className="space-y-4 pt-2 border-t border-indigo-950/60 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Verified Extracted Evidence
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Type: {analysisData.documentType}
              </span>
            </div>

            {/* Dates Found */}
            {analysisData.dates.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  DATE FOUND ({analysisData.dates.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysisData.dates.map((d, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs flex items-center gap-2"
                    >
                      <strong className="font-mono text-white">{d.date}</strong>
                      {d.context && (
                        <span className="text-slate-400 text-[11px] max-w-[200px] truncate">
                          ({d.context})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amounts Found */}
            {analysisData.amounts.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  AMOUNT FOUND ({analysisData.amounts.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysisData.amounts.map((amt, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs flex items-center gap-2"
                    >
                      <strong className="font-mono text-emerald-300 font-bold">{amt.amount}</strong>
                      {amt.context && (
                        <span className="text-slate-400 text-[11px] max-w-[220px] truncate">
                          ({amt.context})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parties Found */}
            {analysisData.peopleOrEntities.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  PARTY FOUND ({analysisData.peopleOrEntities.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysisData.peopleOrEntities.map((party, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs flex items-center gap-1.5"
                    >
                      <span className="font-medium text-white">{party.name}</span>
                      <span className="text-[10px] font-mono text-purple-300 capitalize">
                        [{party.role}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clauses Found */}
            {analysisData.relevantClauses && analysisData.relevantClauses.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  CLAUSE FOUND ({analysisData.relevantClauses.length})
                </span>
                <div className="space-y-1.5">
                  {analysisData.relevantClauses.map((clause, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-100/90 leading-relaxed font-mono"
                    >
                      § {clause}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Established Items with Confidence */}
            {analysisData.evidenceItems.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Established Proof &amp; Relevance
                </span>
                <div className="space-y-2">
                  {analysisData.evidenceItems.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-medium text-white">{item.item}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.significance}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                        {Math.round(item.confidence * 100)}% verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ambiguities */}
            {analysisData.uncertainItems.length > 0 && (
              <div className="rounded-xl bg-amber-950/20 border border-amber-800/40 p-3.5 text-xs text-amber-200">
                <strong className="font-semibold text-amber-300 block mb-1">
                  Items Requiring Further Verification:
                </strong>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/80">
                  {analysisData.uncertainItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
