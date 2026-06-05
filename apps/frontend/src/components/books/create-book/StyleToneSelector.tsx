'use client';

const STYLES = ['Watercolor', 'Cartoon', 'Realistic', 'Pixar', 'Sketch', 'Manga', 'Comic'] as const;
const TONES = ['Warm', 'Educational', 'Playful', 'Magical', 'Adventurous'] as const;

type StyleToneSelectorProps = {
  selectedStyle: string;
  selectedTone: string;
  onStyleChange: (style: string) => void;
  onToneChange: (tone: string) => void;
};

export function StyleToneSelector({
  selectedStyle,
  selectedTone,
  onStyleChange,
  onToneChange,
}: StyleToneSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-[16px] font-extrabold text-ab-text">3. Select style</h2>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => {
            const isSelected = selectedStyle === style;
            return (
              <button
                key={style}
                type="button"
                onClick={() => onStyleChange(style)}
                className={`rounded-[18px] px-3 py-2 text-[13px] font-extrabold transition-colors ${
                  isSelected
                    ? 'bg-ab-primary text-white ring-1 ring-ab-primary'
                    : 'bg-ab-surface text-ab-text ring-1 ring-ab-border hover:ring-ab-primary/30'
                }`}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-[16px] font-extrabold text-ab-text">3. Select tone</h2>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => {
            const isSelected = selectedTone === tone;
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onToneChange(tone)}
                className={`rounded-[18px] px-3 py-2 text-[13px] font-extrabold transition-colors ${
                  isSelected
                    ? 'bg-ab-primary text-white ring-1 ring-ab-primary'
                    : 'bg-ab-surface text-ab-text ring-1 ring-ab-border hover:ring-ab-primary/30'
                }`}
              >
                {tone}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
