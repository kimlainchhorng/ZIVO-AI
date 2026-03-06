import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ZIVO AI — Agentic App Builder",
  description: "Build, deploy, and iterate full-stack apps with ZIVO AI",
  keywords: ["Builder", "Workflow", "Templates", "History", "Connectors"],
  openGraph: {
    title: "ZIVO AI — Agentic App Builder",
    description: "Build, deploy, and iterate full-stack apps with ZIVO AI",
    type: "website",
    siteName: "ZIVO AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZIVO AI — Agentic App Builder",
    description: "Build, deploy, and iterate full-stack apps with ZIVO AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
