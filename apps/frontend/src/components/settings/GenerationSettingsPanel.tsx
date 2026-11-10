'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import SettingsPanel from './SettingsPanel';

type ReasoningEffort = 'LOW' | 'MEDIUM' | 'HIGH';

type GenerationSettings = {
  llmModel: string;
  reasoningEffort: ReasoningEffort;
  availableModels: string[];
};

const REASONING_EFFORTS: ReasoningEffort[] = ['LOW', 'MEDIUM', 'HIGH'];

const REASONING_LABELS: Record<ReasoningEffort, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

function normalizeSettings(payload: unknown): GenerationSettings {
  const value = (payload ?? {}) as Partial<GenerationSettings>;
  const llmModel = typeof value.llmModel === 'string' ? value.llmModel : '';
  const availableModels =
    Array.isArray(value.availableModels) && value.availableModels.length > 0
      ? value.availableModels.filter((model): model is string => typeof model === 'string')
      : llmModel
        ? [llmModel]
        : [];

  return {
    llmModel,
    reasoningEffort: REASONING_EFFORTS.includes(value.reasoningEffort as ReasoningEffort)
      ? (value.reasoningEffort as ReasoningEffort)
      : 'MEDIUM',
    availableModels,
  };
}

export default function GenerationSettingsPanel() {
  const [settings, setSettings] = useState<GenerationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const response = await fetch('/api/settings/generation');
      if (!response.ok) throw new Error('Generation settings could not be loaded');
      setSettings(normalizeSettings(await response.json()));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Generation settings could not be loaded'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const response = await fetch('/api/settings/generation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llmModel: settings.llmModel,
          reasoningEffort: settings.reasoningEffort,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Generation settings could not be saved');
      }

      setSettings(normalizeSettings(await response.json()));
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Generation settings could not be saved'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPanel
      title='Generation defaults'
      description='These settings are applied to every new book. Existing books keep the settings they were created with.'
    >
      {loading ? (
        <p className='text-sm text-muted-foreground'>Loading generation settings...</p>
      ) : settings ? (
        <div className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <label htmlFor='generation-model' className='text-sm font-medium text-foreground'>
                Text model
              </label>
              <select
                id='generation-model'
                aria-label='Text model'
                value={settings.llmModel}
                onChange={(event) => {
                  setSettings({ ...settings, llmModel: event.target.value });
                  setSaved(false);
                }}
                className='h-[44px] w-full rounded-[10px] border border-input bg-input-bg px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
              >
                {settings.availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label htmlFor='generation-effort' className='text-sm font-medium text-foreground'>
                Reasoning effort
              </label>
              <select
                id='generation-effort'
                aria-label='Reasoning effort'
                value={settings.reasoningEffort}
                onChange={(event) => {
                  setSettings({
                    ...settings,
                    reasoningEffort: event.target.value as ReasoningEffort,
                  });
                  setSaved(false);
                }}
                className='h-[44px] w-full rounded-[10px] border border-input bg-input-bg px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
              >
                {REASONING_EFFORTS.map((effort) => (
                  <option key={effort} value={effort}>
                    {REASONING_LABELS[effort]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-xs text-muted-foreground'>
              The model list comes from the backend <code>LLM_MODELS</code> allowlist.
            </p>
            <Button type='button' onClick={handleSave} loading={saving}>
              Save generation settings
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className='mt-3 flex items-center gap-3'>
          <p className='text-sm text-destructive' role='alert'>
            {error}
          </p>
          <Button type='button' variant='outline' size='sm' onClick={loadSettings}>
            Retry
          </Button>
        </div>
      ) : null}

      {saved ? (
        <output className='mt-3 block text-sm text-success'>Generation settings saved.</output>
      ) : null}
    </SettingsPanel>
  );
}
