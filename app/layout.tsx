import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "ZIVO-AI | AI-Powered Website Builder",
  description: "Build and deploy beautiful websites with AI. ZIVO-AI generates clean, production-ready website code from your prompts.",
  keywords: ["AI", "website builder", "code generation", "Next.js"],
  authors: [{ name: "ZIVO-AI" }],
  openGraph: {
    title: "ZIVO-AI | AI-Powered Website Builder",
    description: "Build and deploy beautiful websites with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
