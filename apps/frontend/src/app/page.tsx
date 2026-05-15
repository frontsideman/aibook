'use client';

import React, { useEffect, useState } from 'react';

export default function GalleryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch books:', err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">Book Gallery</h1>
      
      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.length > 0 ? (
            books.map((book) => (
              <div key={book.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[1.414/1] bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">A3 Landscape Cover</span>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-xl">{book.title}</h2>
                  <p className="text-gray-600 text-sm mt-1">Style: {book.style}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {book.status}
                    </span>
                    <button className="text-blue-500 hover:underline">View Details</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No books found. Why not create one?</p>
          )}
        </div>
      )}
    </main>
  );
}
