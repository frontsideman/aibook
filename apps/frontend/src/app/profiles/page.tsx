'use client';

import React, { useEffect, useState } from 'react';

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
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [interests, setInterests] = useState('');

  const fetchProfiles = () => {
    fetch('/api/child-profiles')
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/child-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        age: parseInt(age),
        gender,
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
      }),
    });

    if (res.ok) {
      setName('');
      setAge('');
      setGender('male');
      setInterests('');
      setShowForm(false);
      fetchProfiles();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return;
    await fetch(`/api/child-profiles/${id}`, { method: 'DELETE' });
    fetchProfiles();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Child Profiles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : 'Add Profile'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-4 border rounded-lg space-y-3">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            min={1}
            max={18}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input
            placeholder="Interests (comma separated)"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Save</button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-2">No profiles found</p>
          <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline text-sm">
            Create your first profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <p className="text-sm text-gray-600">{profile.age} years · {profile.gender}</p>
                </div>
                <button onClick={() => handleDelete(profile.id)} className="text-red-500 text-sm hover:underline">
                  Delete
                </button>
              </div>
              {profile.interests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {profile.interests.map((interest, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
