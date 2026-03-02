import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI Builder",
  description: "Build websites and mobile apps with AI",
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
