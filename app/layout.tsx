import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI",
  description: "ZIVO AI Dashboard",
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
