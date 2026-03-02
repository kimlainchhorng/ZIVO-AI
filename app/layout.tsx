import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI — The Ultimate AI Platform",
  description:
    "ZIVO AI: AI-powered search, analytics, voice AI, blockchain/Web3, ML integration, workflow automation, 50+ integrations and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
