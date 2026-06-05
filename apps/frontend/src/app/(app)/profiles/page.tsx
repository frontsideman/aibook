"use client";

import React, { useEffect, useState } from "react";

import ChildProfileCard, { type ChildProfile } from "@/components/ChildProfileCard";
import ProfileEditPanel from "@/components/ProfileEditPanel";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Family
          </p>
          <h1 className="section-heading !text-3xl">Child Profiles</h1>
        </div>
        <button
          onClick={openCreatePanel}
          className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Add Profile
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="paper-card py-12 text-center">
          <p className="mb-2 text-muted-foreground">No profiles found</p>
          <button
            onClick={openCreatePanel}
            className="text-sm text-primary hover:underline"
          >
            Create your first profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
