'use client';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LibraryFilterBarProps = {
  search: string;
  status: string;
  style: string;
  type: string;
  profile: string;
  profiles: string[];
  sort: 'updated' | 'title';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onProfileChange: (value: string) => void;
  onSortChange: (value: 'updated' | 'title') => void;
};

const STATUSES = ['', 'DRAFT', 'GENERATING', 'REVIEW', 'COMPLETED', 'FAILED'];
const TYPES = ['', 'AI_ADAPTED', 'MANUAL'];
const STYLES = ['', 'WATERCOLOR', 'CARTOON', 'REALISTIC', 'PIXAR', 'SKETCH', 'MANGA', 'COMIC'];

function FilterDropdown({
  label,
  value,
  options,
  allLabel,
  profiles,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | null;
  allLabel: string;
  profiles?: string[];
  onChange: (value: string) => void;
}) {
  const resolvedOptions = options ?? profiles ?? [];

  return (
    <Select value={value || '__all'} onValueChange={(v) => onChange(v === '__all' ? '' : v)}>
      <SelectTrigger
        aria-label={`Filter by ${label.toLowerCase()}`}
        className='h-[42px] min-w-[100px] rounded-[10px] border-border bg-input-bg px-[11px] text-[13px] font-bold text-foreground'
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='__all'>{allLabel || `All ${label}s`}</SelectItem>
        {resolvedOptions.filter(Boolean).map((entry) => (
          <SelectItem key={entry} value={entry}>
            {entry}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function LibraryFilterBar({
  search,
  status,
  style,
  type,
  profile,
  profiles,
  sort,
  onSearchChange,
  onStatusChange,
  onStyleChange,
  onTypeChange,
  onProfileChange,
  onSortChange,
}: LibraryFilterBarProps) {
  return (
    <div className='flex items-center gap-[8px] rounded-[16px] border border-border bg-card p-[8px]'>
      <div className='relative flex-1 min-w-[200px]'>
        <Search
          className='pointer-events-none absolute left-3 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-muted-foreground'
          aria-hidden='true'
        />
        <input
          aria-label='Search books by title'
          placeholder='Search title, profile, or prompt'
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className='h-[42px] w-full rounded-[10px] border border-border bg-input-bg pl-[38px] pr-3 text-[14px] text-foreground placeholder-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
        />
      </div>

      <FilterDropdown
        label='Status'
        value={status}
        options={STATUSES}
        allLabel='All Status'
        onChange={onStatusChange}
      />
      <FilterDropdown
        label='Style'
        value={style}
        options={STYLES}
        allLabel='All Styles'
        onChange={onStyleChange}
      />
      <FilterDropdown
        label='Type'
        value={type}
        options={TYPES}
        allLabel='All Types'
        onChange={onTypeChange}
      />
      <FilterDropdown
        label='Profile'
        value={profile}
        options={null}
        allLabel='All Profiles'
        profiles={profiles}
        onChange={onProfileChange}
      />
      <FilterDropdown
        label='Sort'
        value={sort}
        options={['updated', 'title']}
        allLabel=''
        onChange={(v) => onSortChange(v as 'updated' | 'title')}
      />
    </div>
  );
}
