import type { Metadata } from "next";
import "./globals.css";
import GlobalProviders from "./GlobalProviders";

// Using local system fonts instead of Google Fonts for offline compatibility
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "ZIVO AI — The AI Builder Platform",
  description: "Build, deploy and scale AI-powered applications with ZIVO AI",
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
        <GlobalProviders />
        {children}
      </body>
    </html>
  );
}
