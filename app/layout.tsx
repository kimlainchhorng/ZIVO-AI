import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import GlobalProviders from "./GlobalProviders";

export const metadata: Metadata = {
  title: "ZIVO AI — Agentic App Builder",
  description: "Build, deploy, and iterate full-stack apps with ZIVO AI",
  keywords: ["Builder", "Workflow", "Templates", "History", "Connectors"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <GlobalProviders />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
