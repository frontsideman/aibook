'use client';

import { useState } from 'react';

type Illustration = {
  id: string;
  url?: string;
  prompt: string;
};

type Page = {
  id: string;
  pageNumber: number;
  textContent: string;
  illustrations: Illustration[];
};

type SpreadViewerProps = {
  pages: Page[];
};

export default function SpreadViewer({ pages }: SpreadViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = pages.length;

  const page = pages[currentPage];
  if (!page) return null;

  return (
    <div>
      <div className="paper-card overflow-hidden">
        <div className="aspect-[1.414/1] bg-gradient-to-br from-amber-50 via-rose-50/40 to-orange-50 relative flex items-center justify-center">
          {page.illustrations[0]?.url ? (
            <img
              src={page.illustrations[0].url}
              alt={page.illustrations[0].prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-muted-foreground text-sm">Illustration placeholder</div>
          )}
        </div>
        <div className="border-t border-border/70 p-6">
          <p className="text-foreground leading-relaxed text-lg">{page.textContent}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="rounded-xl border border-border/80 bg-card px-4 py-2 text-sm disabled:opacity-30 hover:bg-secondary"
        >
          ← Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="rounded-xl border border-border/80 bg-card px-4 py-2 text-sm disabled:opacity-30 hover:bg-secondary"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
