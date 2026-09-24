/**
 * EvidenceUploaderCard — Interactive file uploader and analysis viewer
 * for AI Module 06 (AI Evidence Analyzer).
 *
 * Supports PDF, PNG, JPEG, WebP up to 10 MB.
 */

'use client';

import { useState, useRef } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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

export function EvidenceUploaderCard({
  onAnalysisComplete,
  onEvidenceAnalyzed,
  existingAnalysis,
  caseNarrative,
  isProcessing = false,
}: EvidenceUploaderCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate MIME type
    if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(file.type as AllowedMimeType)) {
      setUploadError(
        `Unsupported file type (${file.type || 'unknown'}). Please upload a PDF, PNG, JPEG, or WebP document.`
      );
      return;
    }

    // Validate Size
    if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
      setUploadError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`
      );
      return;
    }

    setCurrentFileName(file.name);
    setAnalyzing(true);

    try {
      // Read file to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip prefix data URL (e.g. data:application/pdf;base64,)
          const base64Clean = result.split(',')[1] || result;
          resolve(base64Clean);
        };
        reader.onerror = () => reject(new Error('Failed to read file from disk.'));
        reader.readAsDataURL(file);
      });

      const uploadedPayload: UploadedEvidenceFile = {
        name: file.name,
        mimeType: file.type,
        base64Data,
        sizeBytes: file.size,
      };

      const response = await runEvidenceAnalysis(uploadedPayload, caseNarrative);
      uploadedPayload.analysisResult = response.data;
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data, uploadedPayload);
      }
      if (onEvidenceAnalyzed) {
        await onEvidenceAnalyzed(uploadedPayload);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Evidence analysis failed. Please try again.';
      setUploadError(msg);
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <article
      className="rounded-xl border border-neutral-200 bg-white shadow-sm animate-fade-in overflow-hidden"
      aria-labelledby="evidence-uploader-heading"
    >
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Module 06 · Multimodal Evidence
          </span>
          <h3 id="evidence-uploader-heading" className="text-sm font-semibold text-neutral-800">
            Document &amp; Physical Evidence Analysis
          </h3>
        </div>
        {existingAnalysis && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            Document Analyzed ({Math.round(existingAnalysis.confidence * 100)}% Confidence)
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Upload Dropzone */}
        <div className="rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center hover:border-brand-400 transition-colors bg-neutral-50/30">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="evidence-file-input"
            disabled={analyzing || isProcessing}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-2xl" aria-hidden="true">📄</span>
            <label
              htmlFor="evidence-file-input"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 cursor-pointer focus-within:underline"
            >
              Upload Tenancy Agreement, Notice, Contract, or Evidence
            </label>
            <p className="text-xs text-neutral-500">
              PDF, PNG, JPEG, or WebP up to 10 MB. Inspected by Gemini multimodal intelligence.
            </p>
          </div>

          {analyzing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-amber-700">
              <LoadingSpinner size="sm" label="Analyzing document..." />
              <span>Inspecting {currentFileName} with Gemini 3.8 Flash...</span>
            </div>
          )}
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
            <span aria-hidden="true">⚠️</span>
            <span>{uploadError}</span>
          </div>
        )}

        {/* Existing Analysis Result */}
        {existingAnalysis && (
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Document Identified:
              </span>
              <span className="text-xs font-semibold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded">
                {existingAnalysis.documentType}
              </span>
            </div>

            {/* Extracted Amounts & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {existingAnalysis.amounts.length > 0 && (
                <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Extracted Financials
                  </h5>
                  <ul className="space-y-1 text-xs text-neutral-700">
                    {existingAnalysis.amounts.map((amt, i) => (
                      <li key={i} className="flex justify-between">
                        <strong className="font-semibold text-neutral-900">{amt.amount}</strong>
                        <span className="text-neutral-500 text-[11px] truncate max-w-[150px]">{amt.context}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {existingAnalysis.dates.length > 0 && (
                <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Document Dates
                  </h5>
                  <ul className="space-y-1 text-xs text-neutral-700">
                    {existingAnalysis.dates.map((d, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="font-mono text-neutral-800">{d.date}</span>
                        <span className="text-neutral-500 text-[11px] truncate max-w-[150px]">{d.context}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Identified Parties */}
            {existingAnalysis.peopleOrEntities.length > 0 && (
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Contractual Parties
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {existingAnalysis.peopleOrEntities.map((party, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700"
                    >
                      <strong className="font-medium">{party.name}</strong> ({party.role})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence items with confidence */}
            {existingAnalysis.evidenceItems.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Key Evidentiary Items Established
                </h5>
                <ul className="space-y-1">
                  {existingAnalysis.evidenceItems.map((item, i) => (
                    <li
                      key={i}
                      className="rounded bg-neutral-50 p-2 border border-neutral-100 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-medium text-neutral-800">{item.item}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{item.significance}</p>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Uncertainties requiring clarification */}
            {existingAnalysis.uncertainItems.length > 0 && (
              <div className="rounded-lg bg-amber-50/50 border border-amber-200 p-3 text-xs text-amber-900">
                <strong className="font-semibold">Ambiguities / Needs Clarification:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                  {existingAnalysis.uncertainItems.map((item, i) => (
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
}
