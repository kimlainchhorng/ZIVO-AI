import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI - The Ultimate AI Platform",
  description: "ZIVO AI is the world's most comprehensive AI platform. Build, deploy, and scale AI-powered applications across every industry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
