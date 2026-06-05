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
        <h2 className="text-[16px] font-extrabold text-ab-text">
          1. Select child profile
        </h2>
        <button
          type="button"
          className="rounded-[9px] border border-ab-border px-3 py-2 text-[13px] font-extrabold text-ab-primary transition-colors hover:bg-ab-surface"
        >
          Create Child Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-[14px] border border-ab-border bg-[#FFF7E8] p-3.5">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-ab-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ab-text">No child profiles yet</p>
              <p className="text-xs text-ab-muted">
                Create a child profile to get started with personalized stories.
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-ab-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:opacity-90"
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
                    ? 'border-ab-primary bg-[#FFF7E8] shadow-[0_8px_18px_-14px_#9B5E1A18]'
                    : 'border-ab-border bg-ab-card hover:border-ab-primary/30'
                }`}
              >
                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-ab-accent ring-1 ring-[#B98F4B]">
                  <span className="text-lg font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-ab-text">{profile.name}</p>
                  <p className="text-[12px] text-ab-muted">{profile.age} years old</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
