import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI – Ultimate Application Generation Platform",
  description: "The all-in-one AI application generation powerhouse with search, monitoring, Web3, testing, performance, voice AI, AR/VR, ML, CMS, security, deployment, API management, data, analytics, and workflow features.",
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
