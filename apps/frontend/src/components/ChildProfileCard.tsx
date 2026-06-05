"use client";

import { Pencil, Trash2 } from "lucide-react";

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
};

type ChildProfileCardProps = {
  profile: ChildProfile;
  onEdit?: () => void;
  onDelete?: () => void;
};

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).join("");
}

export default function ChildProfileCard({
  profile,
  onEdit,
  onDelete,
}: ChildProfileCardProps) {
  const genderLabel = profile.gender === "female" ? "Girl" : "Boy";
  const meta = `Age ${profile.age} · ${genderLabel}`;
  const initials = getInitials(profile.name);
  const hasInterests = profile.interests.length > 0;

  return (
    <div
      data-testid="child-profile-card"
      className="paper-card flex h-full flex-col gap-[14px] rounded-[18px] p-[18px]"
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-semibold text-primary-foreground"
        >
          {initials}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <h3 className="truncate font-display text-[28px] font-semibold leading-tight text-foreground">
            {profile.name}
          </h3>
          <p className="text-[13px] text-muted-foreground">{meta}</p>
        </div>
      </div>

      {hasInterests && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-muted-foreground">
            Interests
          </span>
          <div className="flex flex-wrap gap-2" data-testid="interest-chips">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex h-7 items-center rounded-[14px] border border-border bg-secondary px-[9px] text-[12px] font-bold text-muted-foreground"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${profile.name}`}
          className="inline-flex h-9 items-center gap-[7px] rounded-[9px] border border-border bg-card px-3 text-[13px] font-extrabold text-foreground transition hover:bg-secondary"
        >
          <Pencil className="h-[14px] w-[14px] text-muted-foreground" aria-hidden="true" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${profile.name}`}
          className="inline-flex h-9 items-center gap-[7px] rounded-[9px] border border-border bg-transparent px-3 text-[13px] font-extrabold text-destructive transition hover:bg-secondary"
        >
          <Trash2 className="h-[14px] w-[14px] text-destructive" aria-hidden="true" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
