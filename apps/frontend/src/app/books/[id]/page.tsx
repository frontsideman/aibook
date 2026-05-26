'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${params.id}/preview`)
      .then((r) => r.json())
      .then((json) => {
        setBook(json.book || json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDownload = () => {
    fetch(`/api/books/${params.id}/pdf`)
      .then((r) => r.json())
      .then(({ pdfUrl }) => {
        window.open(pdfUrl, '_blank');
      })
      .catch(console.error);
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!book) return <p className="text-red-600">Book not found</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <a href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">← Back to Dashboard</a>

      <div className="aspect-[1.414/1] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mb-6">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-gray-400 text-sm">{book.style}</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">{book.title}</h1>

      <div className="flex gap-2 mb-6">
        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded">{book.status}</span>
        {book.style && <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded">{book.style}</span>}
        {book.tone && <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded">{book.tone}</span>}
      </div>

      {book.status === 'COMPLETED' && (
        <button
          onClick={handleDownload}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Download PDF
        </button>
      )}

      {book.pages && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Pages</h2>
          {book.pages.map((page: any) => (
            <div key={page.id} className="border rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Page {page.pageNumber}</p>
              <p className="text-sm">{page.textContent}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
