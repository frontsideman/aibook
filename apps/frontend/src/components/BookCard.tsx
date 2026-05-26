'use client';

import Link from 'next/link';

type BookCardProps = {
  id: string;
  title: string;
  style: string;
  status: string;
  childName?: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GENERATING: 'bg-yellow-100 text-yellow-800',
  REVIEW: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export default function BookCard({ id, title, style, status, childName, createdAt }: BookCardProps) {
  const href = status === 'COMPLETED' ? `/books/${id}` : `/books/${id}/preview`;

  return (
    <Link href={href} className="block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[1.414/1] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-4xl mb-2">📖</div>
          <p className="text-xs text-gray-400">{style}</p>
        </div>
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-lg truncate">{title}</h2>
        {childName && <p className="text-gray-500 text-sm">For: {childName}</p>}
        <div className="mt-3 flex justify-between items-center">
          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
          <span className="text-xs text-gray-400">{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
