/**
 * IntakeForm component tests.
 * Verifies rendering, accessibility, basic interactions, and AI integration.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeForm } from '@/components/intake/IntakeForm';

// Mock Firebase modules
jest.mock('@/lib/firebase/firebase', () => ({
  app: { options: { projectId: 'test' } },
  auth: {},
  db: {},
}));

// Mock AI intake module so tests don't call Gemini
jest.mock('@/lib/ai/intakeModule', () => ({
  runIntakeUnderstanding: jest.fn().mockResolvedValue({
    data: {
      summary: 'Landlord refused to return deposit.',
      legalDomains: ['housing'],
      keyFacts: ['Deposit not returned after move-out'],
      entities: [{ name: 'Landlord', role: 'respondent' }],
      urgencyLevel: 'MEDIUM',
      clarificationNeeded: [],
    },
    model: 'gemini-2.0-flash',
    generatedAt: new Date().toISOString(),
  }),
}));

describe('IntakeForm', () => {
  it('renders the textarea with accessible label', () => {
    render(<IntakeForm />);
    expect(screen.getByRole('textbox', { name: /what happened/i })).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<IntakeForm />);
    expect(screen.getByRole('button', { name: /start with my story/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue without evidence/i })).toBeInTheDocument();
  });

  it('shows validation error when text is too short', async () => {
    const user = userEvent.setup();
    render(<IntakeForm />);

    const textarea = screen.getByRole('textbox', { name: /what happened/i });
    await user.type(textarea, 'short');
    await user.click(screen.getByRole('button', { name: /start with my story/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('textarea has aria-required attribute', () => {
    render(<IntakeForm />);
    const textarea = screen.getByRole('textbox', { name: /what happened/i });
    expect(textarea).toHaveAttribute('aria-required', 'true');
  });
});
