'use client';

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems ?? page * itemsPerPage);

  return (
    <div className='flex h-12 items-center justify-between' data-testid='pagination'>
      <p className='text-[13px] text-muted-foreground'>
        {totalItems != null
          ? `Showing ${start}-${end} of ${totalItems} books`
          : `Page ${page} of ${totalPages}`}
      </p>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className='inline-flex h-9 items-center rounded-[9px] border border-border bg-card px-[11px] text-[13px] font-bold text-foreground transition hover:bg-[var(--dashboard-table-header)] disabled:cursor-not-allowed disabled:opacity-30'
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type='button'
            onClick={() => onPageChange(p)}
            className={`inline-flex h-9 items-center rounded-[9px] px-[11px] text-sm font-bold transition ${
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-surface text-foreground hover:bg-[var(--dashboard-table-header)]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type='button'
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className='inline-flex h-9 items-center rounded-[9px] border border-border bg-card px-[11px] text-[13px] font-bold text-foreground transition hover:bg-[var(--dashboard-table-header)] disabled:cursor-not-allowed disabled:opacity-30'
        >
          Next
        </button>
      </div>
    </div>
  );
}
