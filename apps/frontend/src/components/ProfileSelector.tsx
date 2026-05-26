'use client';

type ChildProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
};

type ProfileSelectorProps = {
  profiles: ChildProfile[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export default function ProfileSelector({ profiles, selectedId, onSelect }: ProfileSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => onSelect(profile.id)}
          className={`p-4 rounded-lg border text-left transition-all ${
            selectedId === profile.id
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <h3 className="font-semibold">{profile.name}</h3>
          <p className="text-sm text-gray-600">{profile.age} years old · {profile.gender}</p>
          <p className="text-xs text-gray-400 mt-1">{profile.interests?.join(', ')}</p>
        </button>
      ))}
    </div>
  );
}
