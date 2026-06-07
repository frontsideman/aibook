"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";

import ChildProfileCard, {
  type ChildProfile,
} from "@/components/ChildProfileCard";
import ProfileEditPanel from "@/components/ProfileEditPanel";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(
    null,
  );
  const searchParams = useSearchParams();

  const fetchProfiles = () => {
    fetch("/api/child-profiles")
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      openCreatePanel();
    }
  }, [searchParams]);

  const handleCreate = async (data: {
    name: string;
    age: number;
    gender: string;
    interests: string[];
  }) => {
    const res = await fetch("/api/child-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setPanelOpen(false);
      fetchProfiles();
    }
  };

  const handleUpdate = async (data: {
    name: string;
    age: number;
    gender: string;
    interests: string[];
  }) => {
    if (!editingProfile) return;
    const res = await fetch(`/api/child-profiles/${editingProfile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setPanelOpen(false);
      setEditingProfile(null);
      fetchProfiles();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/child-profiles/${id}`, { method: "DELETE" });
    setPanelOpen(false);
    setEditingProfile(null);
    fetchProfiles();
  };

  const openCreatePanel = () => {
    setEditingProfile(null);
    setPanelOpen(true);
  };

  const openEditPanel = (profile: ChildProfile) => {
    setEditingProfile(profile);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingProfile(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-[720px] space-y-2">
          <p className="font-mono text-[12px] font-extrabold uppercase text-primary">
            PERSONALIZATION
          </p>
          <h1 className="font-display text-[48px] font-semibold leading-none text-foreground">
            Child Profiles
          </h1>
          <p className="text-[16px] text-muted-foreground">
            Manage reusable child details for personalized book generation.
          </p>
        </div>
        <button
          onClick={openCreatePanel}
          className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-primary px-4 text-[14px] font-extrabold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Profile
        </button>
      </div>

      {loading ? (
        <div className="paper-card flex min-h-[220px] items-center justify-center rounded-[18px] p-8">
          <p className="text-[15px] text-muted-foreground">
            Loading profiles...
          </p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="paper-card flex min-h-[220px] flex-col items-center justify-center rounded-[18px] px-6 py-12 text-center">
          <p className="font-display text-[28px] font-semibold text-foreground">
            No profiles yet
          </p>
          <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-muted-foreground">
            Create a child profile to reuse details across book generation.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          data-testid="profiles-grid"
        >
          {profiles.map((profile) => (
            <ChildProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => openEditPanel(profile)}
              onDelete={() => handleDelete(profile.id)}
            />
          ))}
        </div>
      )}

      <ProfileEditPanel
        open={panelOpen}
        profile={editingProfile}
        onClose={closePanel}
        onSave={editingProfile ? handleUpdate : handleCreate}
        onDelete={handleDelete}
      />
    </div>
  );
}
