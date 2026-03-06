"use client";

import React from "react";

interface QuickStartItem {
  label: string;
  icon: string;
  prompt: string;
}

const QUICK_START_ITEMS: QuickStartItem[] = [
  {
    label: "Landing Page",
    icon: "🌐",
    prompt:
      "Build a stunning landing page with hero section, features grid, testimonials, pricing table, and call-to-action. Use modern design with animations.",
  },
  {
    label: "Todo App",
    icon: "✅",
    prompt:
      "Build a full-featured Todo app with task creation, editing, completion toggle, filtering (all/active/completed), drag-and-drop reordering, and local storage persistence.",
  },
  {
    label: "E-commerce",
    icon: "🛍️",
    prompt:
      "Build a complete e-commerce store with product catalog, shopping cart, checkout flow, order management, product search, category filters, and Stripe payment integration.",
  },
  {
    label: "Auth Flow",
    icon: "🔐",
    prompt:
      "Build a complete authentication system with sign-up, login, password reset, email verification, protected routes, JWT tokens, and user profile management.",
  },
  {
    label: "Dashboard",
    icon: "📊",
    prompt:
      "Build an analytics dashboard with KPI cards, line charts, bar charts, data tables, sidebar navigation, date range picker, and real-time data updates.",
  },
];

interface QuickStartGridProps {
  onSelect: (prompt: string) => void;
}

export default function QuickStartGrid({ onSelect }: QuickStartGridProps): React.JSX.Element {
  return (
    <div className="zivo-quickstart">
      <p className="zivo-quickstart-label">Quick start</p>
      <div className="zivo-quickstart-grid">
        {QUICK_START_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelect(item.prompt)}
            className="zivo-quickstart-btn"
            title={item.prompt}
          >
            <span className="zivo-quickstart-icon">{item.icon}</span>
            <span className="zivo-quickstart-text">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
