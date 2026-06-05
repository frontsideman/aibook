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
  DRAFT: 'bg-secondary text-secondary-foreground',
  GENERATING: 'bg-accent/35 text-foreground',
  REVIEW: 'bg-primary/15 text-primary',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
};

export default function BookCard({ id, title, style, status, childName, createdAt }: BookCardProps) {
  const href =
    status === 'COMPLETED'
      ? `/books/${id}`
      : status === 'REVIEW'
        ? `/books/${id}/preview`
        : `/books/${id}/generating`;

  return (
    <Link href={href} className="paper-card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="aspect-[1.414/1] bg-gradient-to-br from-amber-100/80 via-orange-50 to-rose-100/70 flex items-center justify-center border-b border-border/70">
        <div className="text-center p-4">
          <div className="text-4xl mb-2">📖</div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{style}</p>
        </div>
      </div>
      <div className="p-5">
        <h2 className="font-semibold text-xl truncate">{title}</h2>
        {childName && <p className="text-muted-foreground text-sm mt-1">For: {childName}</p>}
        <div className="mt-4 flex justify-between items-center">
          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
          <span className="text-xs text-muted-foreground">{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
