import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  previewUrl?: string;
  tags: string[];
}

const TEMPLATES: AppTemplate[] = [
  {
    id: "saas-dashboard",
    name: "SaaS Dashboard",
    description: "Full-featured SaaS application with user management, billing, and analytics dashboard",
    category: "Business",
    features: ["Authentication", "User Management", "Analytics", "Billing", "Settings"],
    tags: ["saas", "dashboard", "stripe", "analytics"],
  },
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    description: "Complete online store with product catalog, cart, checkout, and order management",
    category: "Commerce",
    features: ["Product Catalog", "Shopping Cart", "Checkout", "Order Management", "Admin Panel"],
    tags: ["ecommerce", "shop", "stripe", "inventory"],
  },
  {
    id: "blog-cms",
    name: "Blog & CMS",
    description: "Content management system with blog, categories, tags, and rich text editor",
    category: "Content",
    features: ["Blog Posts", "Categories", "Tags", "Rich Text Editor", "SEO", "RSS Feed"],
    tags: ["blog", "cms", "content", "seo"],
  },
  {
    id: "social-platform",
    name: "Social Platform",
    description: "Social networking app with profiles, posts, follows, likes, and real-time messaging",
    category: "Social",
    features: ["User Profiles", "Posts & Feed", "Following System", "Real-time Chat", "Notifications"],
    tags: ["social", "realtime", "messaging", "profiles"],
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Task and project management tool with boards, tasks, team collaboration, and timelines",
    category: "Productivity",
    features: ["Projects & Boards", "Tasks", "Team Management", "Time Tracking", "Reports"],
    tags: ["productivity", "kanban", "tasks", "teams"],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Two-sided marketplace connecting buyers and sellers with listings, reviews, and payments",
    category: "Commerce",
    features: ["Listings", "Search & Filter", "Reviews", "Messaging", "Payments", "Seller Dashboard"],
    tags: ["marketplace", "listings", "payments", "reviews"],
  },
  {
    id: "admin-panel",
    name: "Admin Panel",
    description: "Enterprise admin dashboard with user management, data tables, charts, and audit logs",
    category: "Admin",
    features: ["User Management", "Data Tables", "Charts", "Audit Logs", "Settings", "Permissions"],
    tags: ["admin", "crud", "analytics", "permissions"],
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "Modern marketing landing page with hero, features, pricing, testimonials, and CTA",
    category: "Marketing",
    features: ["Hero Section", "Features", "Pricing", "Testimonials", "CTA", "Newsletter"],
    tags: ["landing", "marketing", "seo", "conversion"],
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");

  let templates = TEMPLATES;

  if (category) {
    templates = templates.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }
  if (tag) {
    templates = templates.filter(t => t.tags.includes(tag.toLowerCase()));
  }

  return NextResponse.json({ templates });
}
