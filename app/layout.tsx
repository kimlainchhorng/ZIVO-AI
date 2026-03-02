import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI – Ultimate AI Application Generation Platform",
  description:
    "Build, deploy, and manage AI-powered applications with ZIVO AI's comprehensive generation platform.",
  manifest: "/manifest.json",
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
