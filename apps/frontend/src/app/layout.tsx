import type { Metadata } from "next";
import "./globals.css";
import { MSWProvider } from "@/components/MSWProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider";
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
