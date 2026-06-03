"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [interests, setInterests] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/child-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        age: parseInt(age),
        gender,
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      }),
    });

    if (res.ok) {
      setName("");
      setAge("");
      setGender("male");
      setInterests("");
      setShowForm(false);
      fetchProfiles();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this profile?")) return;
    await fetch(`/api/child-profiles/${id}`, { method: "DELETE" });
    fetchProfiles();
  };

  const startEdit = (profile: ChildProfile) => {
    setEditingProfileId(profile.id);
    setName(profile.name);
    setAge(String(profile.age));
    setGender(profile.gender);
    setInterests(profile.interests.join(", "));
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProfileId(null);
    setName("");
    setAge("");
    setGender("male");
    setInterests("");
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
          onClick={() => (showForm ? handleCancelForm() : setShowForm(true))}
          className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {showForm ? "Cancel" : "Add Profile"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={async (e) => {
            if (editingProfileId) {
              e.preventDefault();
              const res = await fetch(
                `/api/child-profiles/${editingProfileId}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    age: parseInt(age),
                    gender,
                    interests: interests
                      .split(",")
                      .map((i) => i.trim())
                      .filter(Boolean),
                  }),
                },
              );

              if (res.ok) {
                handleCancelForm();
                fetchProfiles();
              }
              return;
            }
            await handleCreate(e);
          }}
          className="paper-card mb-8 space-y-3 p-5"
        >
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            min={1}
            max={18}
            className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input
            placeholder="Interests (comma separated)"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            {editingProfileId ? "Update Profile" : "Save"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="paper-card py-12 text-center">
          <p className="mb-2 text-muted-foreground">No profiles found</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary hover:underline"
          >
            Create your first profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="paper-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{profile.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {profile.age} years · {profile.gender}
                </p>
              </CardHeader>
              <CardContent>
                {profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.map((interest, i) => (
                      <span
                        key={i}
                        className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between align-center gap-3 py-2">
                <button
                  onClick={() => startEdit(profile)}
                  className="text-sm text-primary hover:underline m-0"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="text-sm text-red-600 hover:underline m-0"
                >
                  Delete
                </button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
