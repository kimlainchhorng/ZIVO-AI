import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI – Sci-Fi Future Platform",
  description:
    "The omnipotent AI platform integrating quantum computing, AGI architecture, metaverse, biotech, cosmic-scale infrastructure, and more.",
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
