"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Book = { id: string; title: string; status: string; style?: string };

export default function GeneratingPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/books/${params.id}`);
        if (!res.ok) throw new Error("Book not found");
        const json = await res.json();
        const currentBook = json.book ?? json;

        if (cancelled) return;
        setBook(currentBook);

        if (currentBook.status === "REVIEW") {
          router.replace(`/books/${params.id}/preview`);
          return;
        }

        if (currentBook.status === "COMPLETED") {
          router.replace(`/books/${params.id}`);
          return;
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [params.id, router]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-16 text-center">
      <div className="paper-card w-full p-8">
        <p className="mb-3 text-xs uppercase text-muted-foreground">
          Generating
        </p>
        <h1 className="section-heading !text-3xl">
          {book?.title ?? "Your book is being prepared"}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {book?.status === "FAILED"
            ? "Generation failed. This page will keep checking for an updated status."
            : "This page checks for the latest book status and will redirect when the book is ready."}
        </p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/books/new"
            className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create Another Book
          </Link>
        </div>
      </div>
    </div>
  );
}
