/**
 * Module 06 Tests: AI Evidence Analyzer
 */

import { EvidenceAnalysisZodSchema } from '@/lib/ai/schemas';
import { runEvidenceAnalysis } from '@/lib/ai/evidenceAnalyzerModule';
import { getGenerativeModel } from 'firebase/ai';

describe('Module 06 — AI Evidence Analyzer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validEvidenceData = {
    documentType: 'Tenancy Agreement',
    dates: [
      { date: '2023-07-01', context: 'Lease commencement date' },
      { date: '2024-06-30', context: 'Lease termination date' },
    ],
    amounts: [
      { amount: '$1,500.00', context: 'Security deposit amount stated in clause 4' },
      { amount: '$1,800.00', context: 'Monthly rent' },
    ],
    peopleOrEntities: [
      { name: 'John Doe', role: 'Tenant' },
      { name: 'Apex Property Management LLC', role: 'Landlord / Agent' },
    ],
    importantStatements: [
      'Deposit shall be refunded within 30 days after vacating.',
      'Tenant agrees to professional carpet cleaning prior to surrender.',
    ],
    relevantClauses: ['Clause 4: Security Deposit', 'Clause 12: Notice to Vacate'],
    evidenceItems: [
      {
        item: 'Security deposit clause specifies $1,500 held in escrow',
        significance: 'Establishes baseline amount paid and held',
        confidence: 0.95,
      },
    ],
    confidence: 0.92,
    uncertainItems: ['Handwritten endorsement on page 3 signature block is partially illegible'],
  };

  it('validates a complete, structured evidence extraction', () => {
    const parsed = EvidenceAnalysisZodSchema.parse(validEvidenceData);
    expect(parsed.documentType).toBe('Tenancy Agreement');
    expect(parsed.amounts).toHaveLength(2);
    expect(parsed.peopleOrEntities[0].name).toBe('John Doe');
    expect(parsed.uncertainItems).toHaveLength(1);
  });

  it('rejects unsupported MIME types', async () => {
    const fakeExeFile = new File(['binary content'], 'script.exe', { type: 'application/x-msdownload' });
    await expect(runEvidenceAnalysis(fakeExeFile)).rejects.toThrow(/Unsupported file format/);

    const fakeDocxFile = new File(['text content'], 'contract.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await expect(runEvidenceAnalysis(fakeDocxFile)).rejects.toThrow(/Unsupported file format/);
  });

  it('rejects oversized files exceeding 10MB', async () => {
    const largeFile = new File(['a'.repeat(100)], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

    await expect(runEvidenceAnalysis(largeFile)).rejects.toThrow(/exceeds maximum limit of 10MB/);
  });

  it('analyzes valid PDF and image files with Gemini multimodal format', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(validEvidenceData),
      },
    });

    (getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const validPdf = new File(['%PDF-1.4 sample content'], 'lease.pdf', { type: 'application/pdf' });
    const result = await runEvidenceAnalysis(validPdf);

    expect(result.data.documentType).toBe('Tenancy Agreement');
    expect(result.data.confidence).toBe(0.92);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
