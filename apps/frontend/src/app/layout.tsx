import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MSWProvider } from "@/components/MSWProvider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <MSWProvider>
          <nav className="border-b bg-white sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-8">
                  <Link href="/" className="font-bold text-xl text-blue-600">
                    aiBook
                  </Link>
                  <div className="flex gap-6 text-sm">
                    <Link href="/" className="text-gray-600 hover:text-gray-900">
                      Dashboard
                    </Link>
                    <Link href="/profiles" className="text-gray-600 hover:text-gray-900">
                      Profiles
                    </Link>
                    <Link href="/settings" className="text-gray-600 hover:text-gray-900">
                      Settings
                    </Link>
                  </div>
                </div>
                <Link
                  href="/books/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create Book
                </Link>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </MSWProvider>
      </body>
    </html>
  );
}
