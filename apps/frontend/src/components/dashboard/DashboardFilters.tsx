'use client';

type DashboardFiltersProps = {
  search: string;
  status: string;
  style: string;
  sort: 'updated' | 'title';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onSortChange: (value: 'updated' | 'title') => void;
};

const STATUSES = ['', 'DRAFT', 'GENERATING', 'REVIEW', 'COMPLETED'];
const STYLES = ['', 'WATERCOLOR', 'CARTOON', 'REALISTIC', 'PIXAR', 'SKETCH', 'MANGA', 'COMIC'];

export default function DashboardFilters({
  search,
  status,
  style,
  sort,
  onSearchChange,
  onStatusChange,
  onStyleChange,
  onSortChange,
}: DashboardFiltersProps) {
  return (
    <div className="paper-card mb-8 flex flex-wrap gap-3 p-4">
      <input
        type="text"
        aria-label="Search books by title"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-[220px] flex-1 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
      />
      <select
        aria-label="Filter by status"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
      >
        {STATUSES.map((entry) => (
          <option key={entry} value={entry}>
            {entry || 'All Status'}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by style"
        value={style}
        onChange={(e) => onStyleChange(e.target.value)}
        className="rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
      >
        {STYLES.map((entry) => (
          <option key={entry} value={entry}>
            {entry || 'All Styles'}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort books"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as 'updated' | 'title')}
        className="rounded-xl border border-border/80 bg-background px-3 py-2 text-sm"
      >
        <option value="updated">Last Updated</option>
        <option value="title">Title</option>
      </select>
    </div>
  );
}
