"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

interface Integration {
  emoji: string;
  name: string;
  category: string;
  desc: string;
  connected?: boolean;
}

const allIntegrations: Integration[] = [
  // Productivity
  { emoji: "💬", name: "Slack", category: "Productivity", desc: "Team messaging and notifications" },
  { emoji: "📓", name: "Notion", category: "Productivity", desc: "Collaborative workspace and docs" },
  { emoji: "✅", name: "Asana", category: "Productivity", desc: "Project and task management" },
  { emoji: "📋", name: "Trello", category: "Productivity", desc: "Kanban boards and cards" },
  { emoji: "📅", name: "Monday.com", category: "Productivity", desc: "Work OS for teams" },
  { emoji: "🟣", name: "ClickUp", category: "Productivity", desc: "All-in-one productivity platform" },
  { emoji: "🗃️", name: "Airtable", category: "Productivity", desc: "Spreadsheet-database hybrid" },
  { emoji: "🌐", name: "Google Workspace", category: "Productivity", desc: "Docs, Sheets, Drive and more" },
  { emoji: "🟦", name: "Microsoft 365", category: "Productivity", desc: "Office suite and Teams" },
  { emoji: "☑️", name: "Todoist", category: "Productivity", desc: "Task management app" },
  // CRM
  { emoji: "☁️", name: "Salesforce", category: "CRM", desc: "Enterprise CRM platform", connected: true },
  { emoji: "🟠", name: "HubSpot", category: "CRM", desc: "Inbound marketing and CRM" },
  { emoji: "🔵", name: "Pipedrive", category: "CRM", desc: "Sales pipeline CRM" },
  { emoji: "🟡", name: "Zoho CRM", category: "CRM", desc: "Comprehensive CRM suite" },
  { emoji: "🎧", name: "Freshdesk", category: "CRM", desc: "Customer support platform" },
  { emoji: "💬", name: "Intercom", category: "CRM", desc: "Customer messaging platform" },
  { emoji: "🔷", name: "Zendesk", category: "CRM", desc: "Customer service software" },
  { emoji: "📞", name: "Close CRM", category: "CRM", desc: "Inside sales CRM" },
  // Payment
  { emoji: "💳", name: "Stripe", category: "Payment", desc: "Online payment processing", connected: true },
  { emoji: "🅿️", name: "PayPal", category: "Payment", desc: "Digital payments platform" },
  { emoji: "⬛", name: "Square", category: "Payment", desc: "Point-of-sale and payments" },
  { emoji: "🔶", name: "Braintree", category: "Payment", desc: "Payment gateway by PayPal" },
  { emoji: "🪙", name: "Razorpay", category: "Payment", desc: "India-first payment gateway" },
  { emoji: "🟢", name: "Paddle", category: "Payment", desc: "Revenue delivery platform" },
  { emoji: "📊", name: "Chargebee", category: "Payment", desc: "Subscription billing" },
  { emoji: "🔄", name: "Zuora", category: "Payment", desc: "Subscription management" },
  // DevOps
  { emoji: "🐙", name: "GitHub", category: "DevOps", desc: "Code hosting and CI/CD", connected: true },
  { emoji: "🦊", name: "GitLab", category: "DevOps", desc: "DevSecOps platform" },
  { emoji: "🤖", name: "Jenkins", category: "DevOps", desc: "Open-source automation server" },
  { emoji: "⭕", name: "CircleCI", category: "DevOps", desc: "Continuous integration platform" },
  { emoji: "▲", name: "Vercel", category: "DevOps", desc: "Frontend cloud platform" },
  { emoji: "🟧", name: "AWS", category: "DevOps", desc: "Amazon cloud services" },
  { emoji: "🔵", name: "GCP", category: "DevOps", desc: "Google Cloud Platform" },
  { emoji: "🔷", name: "Azure", category: "DevOps", desc: "Microsoft cloud services" },
  { emoji: "🐳", name: "Docker", category: "DevOps", desc: "Container platform" },
  { emoji: "⚙️", name: "Kubernetes", category: "DevOps", desc: "Container orchestration" },
  // Analytics
  { emoji: "📊", name: "Google Analytics", category: "Analytics", desc: "Web analytics service" },
  { emoji: "🔀", name: "Mixpanel", category: "Analytics", desc: "Product analytics" },
  { emoji: "📈", name: "Amplitude", category: "Analytics", desc: "Digital analytics platform" },
  { emoji: "🔵", name: "Segment", category: "Analytics", desc: "Customer data platform" },
  { emoji: "🦔", name: "PostHog", category: "Analytics", desc: "Open-source product analytics" },
  { emoji: "⛰️", name: "Heap", category: "Analytics", desc: "Digital insights platform" },
  { emoji: "🎬", name: "FullStory", category: "Analytics", desc: "Digital experience analytics" },
  { emoji: "🐕", name: "Datadog", category: "Analytics", desc: "Monitoring and analytics" },
  { emoji: "📉", name: "Grafana", category: "Analytics", desc: "Observability platform" },
  // Social
  { emoji: "🐦", name: "Twitter/X", category: "Social", desc: "Social media platform" },
  { emoji: "💼", name: "LinkedIn", category: "Social", desc: "Professional network" },
  { emoji: "📸", name: "Instagram", category: "Social", desc: "Photo and video sharing" },
  { emoji: "📘", name: "Facebook", category: "Social", desc: "Social network" },
  { emoji: "🎵", name: "TikTok", category: "Social", desc: "Short-form video platform" },
  { emoji: "🎮", name: "Discord", category: "Social", desc: "Community messaging" },
  { emoji: "✈️", name: "Telegram", category: "Social", desc: "Cloud-based messaging" },
  { emoji: "💬", name: "WhatsApp Business", category: "Social", desc: "Business messaging" },
  // Database
  { emoji: "🐘", name: "PostgreSQL", category: "Database", desc: "Relational database" },
  { emoji: "🐬", name: "MySQL", category: "Database", desc: "Open-source RDBMS" },
  { emoji: "🍃", name: "MongoDB", category: "Database", desc: "NoSQL document database" },
  { emoji: "🔴", name: "Redis", category: "Database", desc: "In-memory data store" },
  { emoji: "❄️", name: "Snowflake", category: "Database", desc: "Cloud data warehouse" },
  { emoji: "⚡", name: "Supabase", category: "Database", desc: "Open-source Firebase alternative" },
  { emoji: "🪐", name: "PlanetScale", category: "Database", desc: "Serverless MySQL platform" },
  { emoji: "🌿", name: "Neon", category: "Database", desc: "Serverless PostgreSQL" },
  // AI/ML
  { emoji: "🤖", name: "OpenAI", category: "AI/ML", desc: "GPT models and embeddings", connected: true },
  { emoji: "🧠", name: "Anthropic", category: "AI/ML", desc: "Claude AI models" },
  { emoji: "🤗", name: "Hugging Face", category: "AI/ML", desc: "ML models and datasets" },
  { emoji: "🔁", name: "Replicate", category: "AI/ML", desc: "Run ML models via API" },
  { emoji: "🔷", name: "Cohere", category: "AI/ML", desc: "NLP-focused AI platform" },
  { emoji: "🌲", name: "Pinecone", category: "AI/ML", desc: "Vector database for AI" },
  { emoji: "🕸️", name: "Weaviate", category: "AI/ML", desc: "Open-source vector search" },
  { emoji: "⛓️", name: "LangChain", category: "AI/ML", desc: "LLM application framework" },
  // Communication
  { emoji: "📧", name: "SendGrid", category: "Communication", desc: "Email delivery service" },
  { emoji: "📱", name: "Twilio", category: "Communication", desc: "Communications platform" },
  { emoji: "📨", name: "Mailchimp", category: "Communication", desc: "Email marketing" },
  { emoji: "📮", name: "Postmark", category: "Communication", desc: "Transactional email" },
  { emoji: "✉️", name: "Resend", category: "Communication", desc: "Email for developers" },
  { emoji: "📞", name: "Vonage", category: "Communication", desc: "Communications API" },
  { emoji: "🔴", name: "Liveblocks", category: "Communication", desc: "Realtime collaboration" },
];

const categories = ["All", "Productivity", "CRM", "Payment", "DevOps", "Analytics", "Social", "Database", "AI/ML", "Communication"];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState<Set<string>>(
    new Set(allIntegrations.filter((i) => i.connected).map((i) => i.name))
  );

  const filtered = allIntegrations.filter((i) => {
    const matchCat = activeCategory === "All" || i.category === activeCategory;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleConnect = (name: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Integrations
        </h1>
        <p className="text-gray-400 mb-8">Connect ZIVO AI with your favourite tools ({allIntegrations.length}+ available)</p>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search integrations..."
          className="w-full mb-6 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => {
            const isConnected = connected.has(item.name);
            return (
              <div key={item.name} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-600/50 transition-colors flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleConnect(item.name)}
                  className={`mt-auto rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                    isConnected
                      ? "bg-emerald-900 text-emerald-300 hover:bg-emerald-800"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {isConnected ? "✓ Connected" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">🔌</div>
            <p>No integrations match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
