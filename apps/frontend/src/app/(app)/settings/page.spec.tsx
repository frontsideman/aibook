import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './page';

const originalFetch = global.fetch;

const settingsPayload = {
  llmModel: 'deepseek-flash',
  reasoningEffort: 'MEDIUM',
  availableModels: ['deepseek-flash', 'deepseek-v4-pro'],
};

describe('SettingsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => settingsPayload,
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('renders the settings layout and the live generation panel', async () => {
    render(<SettingsPage />);

    expect(screen.getByText('ACCOUNT')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(
      screen.getByText('Manage subscription, billing, and account preferences.')
    ).toBeInTheDocument();

    expect(await screen.findByText('Generation defaults')).toBeInTheDocument();
    expect(screen.getByText('Current plan')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Danger zone')).toBeInTheDocument();
  });

  it('loads the current generation settings from the backend', async () => {
    render(<SettingsPage />);

    const model = (await screen.findByLabelText('Text model')) as HTMLSelectElement;
    const effort = screen.getByLabelText('Reasoning effort') as HTMLSelectElement;

    expect(model.value).toBe('deepseek-flash');
    expect(effort.value).toBe('MEDIUM');
    expect(global.fetch).toHaveBeenCalledWith('/api/settings/generation');
  });

  it('saves model and reasoning effort changes', async () => {
    const savedPayload = {
      ...settingsPayload,
      llmModel: 'deepseek-v4-pro',
      reasoningEffort: 'HIGH',
    };

    global.fetch = vi.fn(async (input, init) => {
      if (init?.method === 'PATCH') {
        return {
          ok: true,
          json: async () => savedPayload,
        } as Response;
      }

      return { ok: true, json: async () => settingsPayload } as Response;
    }) as unknown as typeof fetch;

    render(<SettingsPage />);

    fireEvent.change(await screen.findByLabelText('Text model'), {
      target: { value: 'deepseek-v4-pro' },
    });
    fireEvent.change(screen.getByLabelText('Reasoning effort'), {
      target: { value: 'HIGH' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save generation settings' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/generation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llmModel: 'deepseek-v4-pro',
          reasoningEffort: 'HIGH',
        }),
      });
    });

    expect(await screen.findByRole('status')).toHaveTextContent('Generation settings saved.');
  });

  it('shows a load error and allows retrying', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settingsPayload,
      }) as unknown as typeof fetch;

    render(<SettingsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Generation settings could not be loaded'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Text model')).toBeInTheDocument();
    });
  });

  it('keeps account-only controls disabled', async () => {
    render(<SettingsPage />);
    await screen.findByText('Generation defaults');

    expect(screen.getByRole('button', { name: 'Manage billing' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download invoices' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeDisabled();

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(3);
    for (const switchControl of switches) {
      expect(switchControl).toBeDisabled();
    }

    expect(screen.getByRole('textbox', { name: 'Confirm account deletion' })).toBeDisabled();
  });
});
