"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

type GenerationSettings = {
  llmModel: string;
  reasoningEffort: string;
};

const MODEL_OPTIONS = [{ value: "openai:gpt-5.4-mini", label: "GPT-5.4 Mini" }];

const REASONING_EFFORT_OPTIONS = [{ value: "MEDIUM", label: "Medium" }];

export default function SettingsPage() {
  const [settings, setSettings] = useState<GenerationSettings>({
    llmModel: MODEL_OPTIONS[0].value,
    reasoningEffort: REASONING_EFFORT_OPTIONS[0].value,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    fetch("/api/settings/generation")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load generation settings");
        }

        const data = (await response.json()) as Partial<GenerationSettings>;
        setSettings({
          llmModel: data.llmModel || MODEL_OPTIONS[0].value,
          reasoningEffort:
            data.reasoningEffort || REASONING_EFFORT_OPTIONS[0].value,
        });
      })
      .catch(() => {
        setLoadError("Generation settings could not be loaded.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await fetch("/api/settings/generation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save generation settings");
      }

      setSaveSuccess("Generation settings saved.");
    } catch {
      setSaveError("Generation settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs font-extrabold uppercase text-muted-foreground">
        Workspace
      </p>
      <h1 className="mt-1 mb-6 font-display text-5xl font-semibold text-foreground">
        Settings
      </h1>

      <div className="paper-card p-6">
        <h2 className="mb-2 text-xl font-semibold">Generation Settings</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Set the model and reasoning effort used for new books.
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading generation settings...
          </p>
        ) : null}
        {loadError ? (
          <p className="mb-4 text-sm text-red-600">{loadError}</p>
        ) : null}
        {saveError ? (
          <p className="mb-4 text-sm text-red-600">{saveError}</p>
        ) : null}
        {saveSuccess ? (
          <p className="mb-4 text-sm text-emerald-700">{saveSuccess}</p>
        ) : null}

        {!loading ? (
          <form className="space-y-5" onSubmit={handleSave}>
            <div className="space-y-2">
              <label htmlFor="llm-model" className="text-sm font-medium">
                Model
              </label>
              <select
                id="llm-model"
                className="h-[44px] w-full rounded-[10px] border border-input bg-input-bg px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input-bg/30"
                value={settings.llmModel}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    llmModel: event.target.value,
                  }))
                }
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="reasoning-effort" className="text-sm font-medium">
                Reasoning effort
              </label>
              <select
                id="reasoning-effort"
                className="h-[44px] w-full rounded-[10px] border border-input bg-input-bg px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input-bg/30"
                value={settings.reasoningEffort}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    reasoningEffort: event.target.value,
                  }))
                }
              >
                {REASONING_EFFORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}>
                Save settings
              </Button>
              <p className="text-xs text-muted-foreground">
                These defaults apply to new books only.
              </p>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
