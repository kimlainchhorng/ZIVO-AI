import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'ZIVO AI — Build Full-Stack Apps with AI',
    template: '%s | ZIVO AI',
  },
  description:
    'ZIVO AI is an AI-powered platform that generates complete full-stack applications from a single prompt.',
  keywords: ['AI', 'code generation', 'Next.js', 'full-stack', 'app builder'],
  authors: [{ name: 'ZIVO AI' }],
  creator: 'ZIVO AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'ZIVO AI — Build Full-Stack Apps with AI',
    description: 'Generate complete full-stack applications from a single prompt.',
    siteName: 'ZIVO AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZIVO AI',
    description: 'Build full-stack apps with AI.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0a0b14',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="bg-[#0a0b14] text-slate-100 antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

