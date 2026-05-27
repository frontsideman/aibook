'use client';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-xl border border-border/80 bg-card px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-30 hover:bg-secondary"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded text-sm ${
            p === page
              ? 'rounded-xl bg-primary px-3 py-1.5 text-sm text-primary-foreground'
              : 'rounded-xl border border-border/80 bg-card px-3 py-1.5 text-sm hover:bg-secondary'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-xl border border-border/80 bg-card px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-30 hover:bg-secondary"
      >
        Next
      </button>
    </div>
  );
}
