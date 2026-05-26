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
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="aspect-[1.414/1] bg-gray-50 relative flex items-center justify-center">
          {page.illustrations[0]?.url ? (
            <img
              src={page.illustrations[0].url}
              alt={page.illustrations[0].prompt}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-gray-300 text-sm">Illustration placeholder</div>
          )}
        </div>
        <div className="p-6 border-t">
          <p className="text-gray-700 leading-relaxed">{page.textContent}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-4 py-2 border rounded text-sm disabled:opacity-30 hover:bg-gray-50"
        >
          ← Previous
        </button>
        <span className="text-sm text-gray-500">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="px-4 py-2 border rounded text-sm disabled:opacity-30 hover:bg-gray-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
