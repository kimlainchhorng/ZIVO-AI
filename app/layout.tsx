import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZIVO AI — The Complete AI-Powered Development Platform",
  description: "Generate websites, mobile apps, and infrastructure with AI",
};

const NAV_LINKS = [
  { href: "/",                          label: "Home"        },
  { href: "/ai",                        label: "AI Builder"  },
  { href: "/dashboard/marketplace",     label: "Marketplace" },
  { href: "/dashboard/team",            label: "Team"        },
  { href: "/dashboard/analytics",       label: "Analytics"   },
  { href: "/dashboard/templates",       label: "Templates"   },
  { href: "/dashboard/plugins",         label: "Plugins"     },
  { href: "/dashboard/integrations",    label: "Integrations"},
  { href: "/dashboard/ai-training",     label: "AI Training" },
  { href: "/dashboard/content",         label: "Content"     },
  { href: "/dashboard/devops",          label: "DevOps"      },
  { href: "/dashboard/settings",        label: "Settings"    },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav style={{
          background: "#0a0a0a",
          borderBottom: "1px solid #1a1a1a",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          overflowX: "auto",
          height: 52,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: 18, color: "#a78bfa", marginRight: 16, textDecoration: "none", whiteSpace: "nowrap" }}>
            ZIVO AI
          </Link>
          {NAV_LINKS.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: "#888",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 8,
                whiteSpace: "nowrap",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {children}
      </body>
    </html>
  );
}
