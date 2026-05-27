import type { Metadata } from "next";
import "./globals.css";
import { MSWProvider } from "@/components/MSWProvider";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "aiBook - AI Generated Children's Books",
  description: "Create personalized AI-generated children's books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <body>
        <ThemeProvider>
          <MSWProvider>
            <nav className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
                <div className="flex min-h-18 items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                      <span className="rounded-lg border border-border/80 bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">
                        STORY
                      </span>
                      <span className="text-2xl font-semibold text-primary">aiBook</span>
                    </Link>
                    <div className="hidden gap-6 text-sm md:flex">
                      <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                        Dashboard
                      </Link>
                      <Link href="/profiles" className="text-muted-foreground transition-colors hover:text-foreground">
                        Profiles
                      </Link>
                      <Link href="/settings" className="text-muted-foreground transition-colors hover:text-foreground">
                        Settings
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ModeToggle />
                    <Link
                      href="/books/new"
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                      Create Book
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
              {children}
            </main>
            <Toaster />
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
