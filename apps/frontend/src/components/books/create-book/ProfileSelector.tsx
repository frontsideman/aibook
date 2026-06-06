'use client';

import { User } from 'lucide-react';

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
};

type ProfileSelectorProps = {
  profiles: ChildProfile[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ProfileSelector({ profiles, selectedId, onSelect }: ProfileSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold text-foreground">
          1. Select child profile
        </h2>
        <button
          type="button"
          className="rounded-[9px] border border-border bg-background px-3 py-2 text-[13px] font-extrabold text-primary transition-colors hover:bg-secondary"
        >
          Create Child Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-secondary p-3.5">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">No child profiles yet</p>
              <p className="text-xs text-muted-foreground">
                Create a child profile to get started with personalized stories.
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:opacity-90"
            >
              Create Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3.5">
          {profiles.map((profile) => {
            const isSelected = selectedId === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-secondary shadow-[0_8px_18px_-14px_oklch(0.22_0.03_56/0.45)]'
                    : 'border-border bg-card hover:border-primary/30 hover:bg-secondary/50'
                }`}
              >
                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-accent ring-1 ring-primary/30">
                  <span className="text-lg font-bold text-accent-foreground">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-foreground">{profile.name}</p>
                  <p className="text-[12px] text-muted-foreground">{profile.age} years old</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
