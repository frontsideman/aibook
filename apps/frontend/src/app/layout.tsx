import type { Metadata } from 'next';
import { Inter, Newsreader, IBM_Plex_Mono } from 'next/font/google';
// oxlint-disable-next-line import/no-unassigned-import
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-display',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
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
      lang='en'
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${ibmPlexMono.variable} font-sans`}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerCleanup />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
