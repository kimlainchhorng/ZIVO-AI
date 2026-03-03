import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI — Build full-stack apps with AI",
  description: "Generate complete, production-ready Next.js apps with AI in seconds.",
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
