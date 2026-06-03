'use client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DashboardFiltersProps = {
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

const STATUSES = ['', 'DRAFT', 'GENERATING', 'REVIEW', 'COMPLETED'];
const TYPES = ['', 'AI_ADAPTED', 'MANUAL'];
const STYLES = ['', 'WATERCOLOR', 'CARTOON', 'REALISTIC', 'PIXAR', 'SKETCH', 'MANGA', 'COMIC'];

export default function DashboardFilters({
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
}: DashboardFiltersProps) {
  return (
    <div className="paper-card mb-8 flex flex-wrap gap-3 p-4">
      <Input
        aria-label="Search books by title"
        placeholder="Search by title..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="min-w-[220px] flex-1"
      />
      <Select value={status || '__all'} onValueChange={(value) => onStatusChange(value === '__all' ? '' : value)}>
        <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All Status" /></SelectTrigger>
        <SelectContent>
          {STATUSES.map((entry) => (
            <SelectItem key={entry || '__all'} value={entry || '__all'}>{entry || 'All Status'}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={style || '__all'} onValueChange={(value) => onStyleChange(value === '__all' ? '' : value)}>
        <SelectTrigger aria-label="Filter by style"><SelectValue placeholder="All Styles" /></SelectTrigger>
        <SelectContent>
          {STYLES.map((entry) => (
            <SelectItem key={entry || '__all'} value={entry || '__all'}>{entry || 'All Styles'}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={type || '__all'} onValueChange={(value) => onTypeChange(value === '__all' ? '' : value)}>
        <SelectTrigger aria-label="Filter by type"><SelectValue placeholder="All Types" /></SelectTrigger>
        <SelectContent>
          {TYPES.map((entry) => (
            <SelectItem key={entry || '__all'} value={entry || '__all'}>{entry || 'All Types'}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={profile || '__all'} onValueChange={(value) => onProfileChange(value === '__all' ? '' : value)}>
        <SelectTrigger aria-label="Filter by profile"><SelectValue placeholder="All Profiles" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">All Profiles</SelectItem>
          {profiles.map((entry) => (
            <SelectItem key={entry} value={entry}>{entry}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(value) => onSortChange(value as 'updated' | 'title')}>
        <SelectTrigger aria-label="Sort books"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Last Updated</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
