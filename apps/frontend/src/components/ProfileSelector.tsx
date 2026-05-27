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
          className={`paper-card p-4 text-left transition-all ${
            selectedId === profile.id
              ? 'border-primary/70 bg-secondary ring-2 ring-primary/20'
              : 'hover:border-primary/30 hover:bg-secondary/50'
          }`}
        >
          <h3 className="font-semibold text-lg">{profile.name}</h3>
          <p className="text-sm text-muted-foreground">{profile.age} years old · {profile.gender}</p>
          <p className="mt-1 text-xs text-muted-foreground">{profile.interests?.join(', ')}</p>
        </button>
      ))}
    </div>
  );
}
