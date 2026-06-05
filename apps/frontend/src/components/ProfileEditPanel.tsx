"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

import { type ChildProfile } from "@/components/ChildProfileCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileEditPanelProps = {
  open: boolean;
  profile: ChildProfile | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    age: number;
    gender: string;
    interests: string[];
  }) => void;
  onDelete: (id: string) => void;
};

export default function ProfileEditPanel({
  open,
  profile,
  onClose,
  onSave,
  onDelete,
}: ProfileEditPanelProps) {
  const isEditing = profile !== null;
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [interests, setInterests] = useState("");
  const [interestsError, setInterestsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (profile) {
        setName(profile.name);
        setAge(String(profile.age));
        setGender(profile.gender);
        setInterests(profile.interests.join(", "));
      } else {
        setName("");
        setAge("");
        setGender("male");
        setInterests("");
      }
      setInterestsError(null);
      setSubmitting(false);
    }
  }, [open, profile]);

  const parseInterests = (raw: string): string[] =>
    raw
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedInterests = parseInterests(interests);
    if (parsedInterests.length === 0) {
      setInterestsError("Add at least one interest.");
      return;
    }
    setInterestsError(null);
    setSubmitting(true);
    try {
      onSave({
        name,
        age: parseInt(age),
        gender,
        interests: parsedInterests,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex w-full max-w-[420px] flex-col overflow-y-auto bg-card shadow-xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="font-display text-[28px] font-semibold text-foreground">
              Edit profile
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Keep details concise and useful for story personalization
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-5">
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-foreground">
                Name
              </label>
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-foreground">
                Age
              </label>
              <Input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min={1}
                max={18}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-foreground">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="h-[44px] w-full min-w-0 rounded-[10px] border border-input bg-input-bg px-3 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              >
                <option value="male">Boy</option>
                <option value="female">Girl</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-foreground">
                Interests
              </label>
              <Input
                data-testid="interests-input"
                placeholder="Interests (comma separated)"
                value={interests}
                onChange={(e) => {
                  setInterests(e.target.value);
                  if (interestsError) setInterestsError(null);
                }}
                aria-invalid={interestsError ? "true" : "false"}
                aria-describedby={
                  interestsError ? "panel-interests-error" : undefined
                }
                className={cn(
                  interestsError && "border-destructive",
                )}
              />
              {interestsError && (
                <p
                  id="panel-interests-error"
                  data-testid="interests-error"
                  className="text-xs font-medium text-destructive"
                >
                  {interestsError}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
            >
              Save
            </Button>
          </div>
        </form>

        {isEditing && (
          <div className="border-t border-border p-5">
            <h3 className="text-[15px] font-bold text-destructive">
              Delete {profile.name}&apos;s profile?
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Once deleted, this profile is unreachable. Future generations will
              no longer use this profile.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-3"
              onClick={() => onDelete(profile.id)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
