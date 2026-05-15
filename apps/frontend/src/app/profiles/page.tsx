import React from 'react';

export default function ProfilesPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Child Profiles</h1>
      <p>Manage your children's profiles here to create personalized books.</p>
      {/* Implementation details will follow in later tasks */}
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <p>No profiles found. Please create one.</p>
        <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Add Profile
        </button>
      </div>
    </div>
  );
}
