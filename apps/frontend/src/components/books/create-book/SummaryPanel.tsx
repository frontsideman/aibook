'use client';

export type SummaryPanelProps = {
  profileName: string;
  profileAge: number;
  storyTitle: string;
  style: string;
  tone: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-ab-border pb-3">
      <span className="font-mono text-[11px] font-extrabold uppercase tracking-wide text-ab-muted">
        {label}
      </span>
      <span className="text-[15px] font-bold text-ab-text">{value}</span>
    </div>
  );
}

export function SummaryPanel({
  profileName,
  profileAge,
  storyTitle,
  style,
  tone,
  isSubmitting,
  canSubmit,
  onSubmit,
}: SummaryPanelProps) {
  return (
    <div className="sticky top-6 flex w-[340px] flex-col gap-5 rounded-[18px] border border-ab-border bg-ab-surface p-5 shadow-[0_12px_24px_#3A281418]">
      <div>
        <h2 className="font-[var(--font-display)] text-[32px] font-semibold text-ab-text">
          Summary
        </h2>
        <p className="text-[13px] text-ab-muted">Confirm the choices before generation.</p>
      </div>

      <div className="flex flex-col gap-3">
        <SummaryRow label="Profile" value={`${profileName}, ${profileAge}`} />
        <SummaryRow label="Story" value={storyTitle} />
        <SummaryRow label="Style" value={style} />
        <SummaryRow label="Tone" value={tone} />
      </div>

      <div className="rounded-[14px] border border-ab-border bg-ab-card p-3.5">
        <span className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-ab-primary">
          First Draft
        </span>
        <h3 className="mt-1 font-[var(--font-display)] text-[25px] leading-tight font-semibold text-ab-text">
          {storyTitle}
        </h3>
        <div className="mt-2.5 h-[54px] rounded-[10px] bg-[#E9C989] ring-1 ring-[#C59B58]" />
      </div>

      <button
        type="button"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
        className={`flex items-center justify-center font-extrabold transition-colors ${
          isSubmitting
            ? 'h-[38px] rounded-[10px] bg-ab-primary text-[14px] text-white'
            : canSubmit
              ? 'h-[46px] rounded-xl bg-ab-primary text-[15px] text-white hover:opacity-90'
              : 'h-[38px] rounded-[10px] bg-[#E1D6C8] text-[14px] text-[#8D8172]'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:300ms]" />
            </span>
            Creating
          </span>
        ) : canSubmit ? (
          'Create Book'
        ) : (
          'Disabled'
        )}
      </button>
    </div>
  );
}
