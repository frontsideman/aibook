import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { MSWProvider } from "@/components/MSWProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} font-sans`}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <MSWProvider>
              {children}
              <Toaster />
            </MSWProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
