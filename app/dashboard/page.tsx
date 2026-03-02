"use client";

import { useState } from "react";
import Link from "next/link";

const tabs = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "search", label: "Search", icon: "🔍" },
  { id: "monitoring", label: "Monitoring", icon: "📊" },
  { id: "web3", label: "Web3", icon: "⛓️" },
  { id: "testing", label: "Testing", icon: "🧪" },
  { id: "performance", label: "Performance", icon: "⚡" },
  { id: "voice", label: "Voice AI", icon: "🎤" },
  { id: "xr", label: "AR/VR", icon: "🥽" },
  { id: "ml", label: "ML", icon: "🤖" },
  { id: "cms", label: "CMS", icon: "📝" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "deployment", label: "Deployment", icon: "🚀" },
  { id: "api-management", label: "API Mgmt", icon: "🔌" },
  { id: "data", label: "Data", icon: "🗄️" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "workflow", label: "Workflow", icon: "⚙️" },
];

function FeatureCard({ title, desc, status = "Active", badge }: { title: string; desc: string; status?: string; badge?: string }) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold text-sm text-white">{title}</span>
        <div className="flex gap-1">
          {badge && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{badge}</span>}
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">{status}</span>
        </div>
      </div>
      <p className="text-xs text-white/50">{desc}</p>
    </div>
  );
}

function MetricCard({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {change && <div className="text-xs text-green-400 mt-1">{change}</div>}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Projects" value="142" change="+12 this week" />
        <MetricCard label="API Calls Today" value="8,423" change="+34% vs yesterday" />
        <MetricCard label="Uptime" value="99.9%" change="Last 30 days" />
        <MetricCard label="Active Users" value="1,284" change="+8% this month" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-white/10 bg-white/5">
          <h3 className="font-semibold text-white mb-4">Platform Health</h3>
          {[
            { name: "AI Builder", status: "Operational" },
            { name: "Search Engine", status: "Operational" },
            { name: "Monitoring", status: "Operational" },
            { name: "Web3 Gateway", status: "Operational" },
            { name: "ML Pipeline", status: "Operational" },
            { name: "Workflow Engine", status: "Operational" },
          ].map((s) => (
            <div key={s.name} className="flex justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/70">{s.name}</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{s.status}</span>
            </div>
          ))}
        </div>
        <div className="p-5 rounded-xl border border-white/10 bg-white/5">
          <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
          {[
            { action: "Smart contract generated", time: "2m ago", icon: "⛓️" },
            { action: "Test suite executed", time: "5m ago", icon: "🧪" },
            { action: "ML model deployed", time: "12m ago", icon: "🤖" },
            { action: "Site published", time: "18m ago", icon: "🚀" },
            { action: "Workflow triggered", time: "25m ago", icon: "⚙️" },
            { action: "Security scan complete", time: "1h ago", icon: "🔒" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span>{a.icon}</span>
              <span className="text-sm text-white/70 flex-1">{a.action}</span>
              <span className="text-xs text-white/30">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchTab() {
  const [query, setQuery] = useState("");
  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, components, templates, snippets..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/8"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors">
          Search
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Semantic Search" desc="AI-powered search across all projects with natural language understanding" badge="AI" />
        <FeatureCard title="Component Library" desc="Browse and search reusable UI components with fuzzy matching" />
        <FeatureCard title="Code Snippets" desc="Find code snippets by functionality, language, or framework" />
        <FeatureCard title="Template Discovery" desc="AI-curated template recommendations based on your needs" badge="AI" />
        <FeatureCard title="Trending Components" desc="See what components and templates are most popular this week" />
        <FeatureCard title="Saved Searches" desc="Save and manage your frequent search queries" />
        <FeatureCard title="Search Analytics" desc="Track search patterns and discover popular queries" />
        <FeatureCard title="Search Filters & Tags" desc="Filter results by type, language, framework, and custom tags" />
        <FeatureCard title="Smart Recommendations" desc="Personalized AI recommendations based on your usage patterns" badge="AI" />
      </div>
    </div>
  );
}

function MonitoringTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Error Rate" value="0.02%" change="↓ 0.01% vs yesterday" />
        <MetricCard label="Avg Response" value="142ms" change="↓ 18ms improvement" />
        <MetricCard label="LCP Score" value="1.8s" change="Good (< 2.5s)" />
        <MetricCard label="Active Alerts" value="0" change="All clear" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-white/10 bg-white/5">
          <h3 className="font-semibold text-white mb-3">Core Web Vitals</h3>
          {[
            { name: "LCP (Largest Contentful Paint)", value: "1.8s", status: "Good" },
            { name: "FID (First Input Delay)", value: "12ms", status: "Good" },
            { name: "CLS (Cumulative Layout Shift)", value: "0.04", status: "Good" },
            { name: "FCP (First Contentful Paint)", value: "1.2s", status: "Good" },
            { name: "TTFB (Time to First Byte)", value: "210ms", status: "Good" },
          ].map((m) => (
            <div key={m.name} className="flex justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/70">{m.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{m.value}</span>
                <span className="text-xs text-green-400">{m.status}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 rounded-xl border border-white/10 bg-white/5">
          <h3 className="font-semibold text-white mb-3">Monitoring Features</h3>
          <div className="space-y-3">
            <FeatureCard title="Error Tracking (Sentry)" desc="Real-time error capture, stack traces, and alerting" />
            <FeatureCard title="Anomaly Detection" desc="AI-powered detection of unusual patterns and spikes" badge="AI" />
            <FeatureCard title="Log Aggregation" desc="Centralized log viewer with search and filtering" />
            <FeatureCard title="Uptime Monitoring" desc="24/7 uptime checks with multi-region verification" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Web3Tab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Contracts Generated" value="38" change="+5 this week" />
        <MetricCard label="Supported Chains" value="12" change="EVM compatible" />
        <MetricCard label="NFT Templates" value="15" change="Ready to deploy" />
        <MetricCard label="DeFi Protocols" value="8" change="Templates available" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Smart Contract Generator" desc="Generate Solidity contracts from natural language with security best practices" badge="AI" />
        <FeatureCard title="NFT Marketplace Builder" desc="Complete NFT marketplace template with minting, trading, and royalties" />
        <FeatureCard title="Wallet Integration" desc="MetaMask and WalletConnect integration with auto-connect" />
        <FeatureCard title="DeFi Protocol Templates" desc="AMM, lending, staking, and yield farming protocol templates" />
        <FeatureCard title="Web3 Authentication" desc="Sign-in with Ethereum (SIWE) and wallet-based auth flows" />
        <FeatureCard title="Token Generator" desc="ERC-20, ERC-721, ERC-1155 token contracts with customization" />
        <FeatureCard title="DAO Setup Templates" desc="Governance contracts with voting, proposals, and treasury management" />
        <FeatureCard title="Staking Contracts" desc="Single-token and LP staking contracts with reward calculations" />
        <FeatureCard title="Multi-Chain Support" desc="Deploy to Ethereum, Polygon, BSC, Arbitrum, Optimism, and more" />
        <FeatureCard title="Web3 Analytics" desc="On-chain analytics, transaction tracking, and user behavior" />
      </div>
    </div>
  );
}

function TestingTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Test Coverage" value="94%" change="+3% this sprint" />
        <MetricCard label="Tests Generated" value="1,847" change="Auto-generated by AI" />
        <MetricCard label="Pass Rate" value="98.7%" change="Last 7 days" />
        <MetricCard label="Avg Run Time" value="3.2m" change="Full suite" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Jest Unit Tests" desc="Auto-generate comprehensive unit tests from your source code" badge="AI" />
        <FeatureCard title="Integration Tests" desc="Generate integration test suites for APIs and service boundaries" badge="AI" />
        <FeatureCard title="E2E with Cypress" desc="End-to-end test generation with page object models and assertions" badge="AI" />
        <FeatureCard title="Playwright Automation" desc="Cross-browser E2E tests with visual snapshots and trace files" badge="AI" />
        <FeatureCard title="Load Testing (k6)" desc="Performance test scripts with configurable VUs and thresholds" />
        <FeatureCard title="Visual Regression" desc="Screenshot comparison testing to catch UI regressions" />
        <FeatureCard title="API Testing" desc="REST and GraphQL API test suites with request/response validation" />
        <FeatureCard title="Test Coverage Reports" desc="Istanbul/NYC coverage reports with branch and statement analysis" />
        <FeatureCard title="Mock Data Generation" desc="Faker.js powered realistic test data factories and fixtures" badge="AI" />
      </div>
    </div>
  );
}

function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Cache Hit Rate" value="87%" change="+12% after Redis" />
        <MetricCard label="CDN Coverage" value="99.1%" change="Global edge nodes" />
        <MetricCard label="Query Time" value="4ms" change="Avg DB query" />
        <MetricCard label="Bundle Size" value="82KB" change="Gzipped" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Redis Caching" desc="Multi-layer caching with Redis Cluster, TTL management, and cache warming" />
        <FeatureCard title="CDN Optimization" desc="Cloudflare integration with custom cache rules and image optimization" />
        <FeatureCard title="GraphQL with Apollo" desc="Apollo Server setup with DataLoader, persisted queries, and subscriptions" />
        <FeatureCard title="Query Optimization" desc="AI-powered SQL and NoSQL query analysis with index recommendations" badge="AI" />
        <FeatureCard title="Edge Computing" desc="Vercel Edge Functions and Cloudflare Workers for ultra-low latency" />
        <FeatureCard title="Service Worker Setup" desc="PWA-ready service worker with offline caching strategies" />
        <FeatureCard title="HTTP Caching" desc="Cache-Control, ETags, and stale-while-revalidate strategies" />
        <FeatureCard title="Performance Budget" desc="Automated budget tracking with Lighthouse CI integration" />
        <FeatureCard title="Offline Capabilities" desc="Background sync, offline storage, and conflict resolution" />
      </div>
    </div>
  );
}

function VoiceTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Languages" value="42" change="Voice supported" />
        <MetricCard label="Accuracy" value="97.3%" change="Speech recognition" />
        <MetricCard label="Intents" value="200+" change="Pre-built intents" />
        <MetricCard label="Responses" value="< 300ms" change="Avg latency" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Voice Command Interface" desc="Web Speech API integration with continuous listening and commands" />
        <FeatureCard title="Chatbot Builder" desc="Visual chatbot designer with NLP, entities, and intent recognition" badge="AI" />
        <FeatureCard title="NLP Integration" desc="NLP.js and custom model support with training pipeline" />
        <FeatureCard title="Multi-Language Voice" desc="42-language voice support with automatic language detection" />
        <FeatureCard title="Speech-to-Text" desc="Real-time transcription with punctuation and speaker diarization" />
        <FeatureCard title="Text-to-Speech" desc="Natural-sounding TTS with 50+ voice styles and emotions" />
        <FeatureCard title="Voice Authentication" desc="Voice biometric authentication with anti-spoofing protection" />
        <FeatureCard title="Conversation Flow Builder" desc="Visual dialog flow designer with conditions and context management" />
        <FeatureCard title="Intent Recognition" desc="Machine learning intent classifier with confidence scoring" badge="AI" />
      </div>
    </div>
  );
}

function XRTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="XR Templates" value="24" change="Ready to use" />
        <MetricCard label="3D Formats" value="8" change="Supported formats" />
        <MetricCard label="Target FPS" value="90fps" change="VR optimized" />
        <MetricCard label="Devices" value="15+" change="Supported headsets" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="WebXR Applications" desc="Full WebXR application generator for VR, AR, and mixed reality" badge="AI" />
        <FeatureCard title="3D Model Integration" desc="glTF, USDZ, FBX, and OBJ support with automatic optimization" />
        <FeatureCard title="VR App Builder" desc="Complete VR application template with locomotion and interaction" />
        <FeatureCard title="Metaverse Templates" desc="Metaverse-ready spaces with avatars, social features, and NFT assets" />
        <FeatureCard title="360° Content" desc="360-degree photo and video viewer with hotspot interactions" />
        <FeatureCard title="Motion Tracking" desc="Hand and body tracking with gesture recognition and actions" />
        <FeatureCard title="Interactive 3D Scenes" desc="Three.js and Babylon.js scene builders with physics engine" />
        <FeatureCard title="Gesture Recognition" desc="Custom gesture vocabulary with training and real-time detection" />
        <FeatureCard title="Spatial Audio" desc="3D positional audio with room acoustics and occlusion" />
      </div>
    </div>
  );
}

function MLTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Models Deployed" value="28" change="+4 this month" />
        <MetricCard label="Predictions/Day" value="124K" change="+18% growth" />
        <MetricCard label="Avg Accuracy" value="94.2%" change="Across all models" />
        <MetricCard label="Inference Time" value="18ms" change="P99 latency" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="TensorFlow.js Deployment" desc="Browser and Node.js model deployment with WebGL acceleration" />
        <FeatureCard title="PyTorch Integration" desc="FastAPI model serving with TorchServe and ONNX export" />
        <FeatureCard title="Model Serving" desc="Scalable inference endpoints with auto-scaling and load balancing" />
        <FeatureCard title="RAG Pipeline" desc="Retrieval-augmented generation with vector DBs and chunking strategies" badge="AI" />
        <FeatureCard title="Vector Database Setup" desc="Pinecone, Weaviate, and pgvector integration with auto-embedding" />
        <FeatureCard title="Multi-Model AI Selection" desc="GPT-4, Claude 3.5, Gemini Ultra with automatic fallback routing" badge="AI" />
        <FeatureCard title="A/B Testing ML Models" desc="Shadow deployments and traffic splitting for model comparison" />
        <FeatureCard title="Feature Engineering" desc="Automated feature extraction, normalization, and selection pipelines" />
        <FeatureCard title="Model Explainability" desc="LIME and SHAP explanations for model predictions" />
      </div>
    </div>
  );
}

function CMSTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Content Items" value="3,842" change="+204 this week" />
        <MetricCard label="Media Assets" value="1,209" change="Optimized & CDN-served" />
        <MetricCard label="Channels" value="8" change="Web, mobile, social" />
        <MetricCard label="Pending Reviews" value="12" change="Editorial workflow" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Headless CMS Integration" desc="Contentful and Strapi integration with type-safe content models" />
        <FeatureCard title="Content Versioning" desc="Full version history with diff viewer and rollback capabilities" />
        <FeatureCard title="Multi-Channel Publishing" desc="Publish to web, mobile apps, and social media simultaneously" />
        <FeatureCard title="Editorial Workflow" desc="Draft, review, approve, and publish workflow with role-based access" />
        <FeatureCard title="Asset Management" desc="Organized media library with tagging, search, and transformation" />
        <FeatureCard title="Content Scheduling" desc="Schedule content publication with timezone support and previews" />
        <FeatureCard title="SEO Metadata Management" desc="AI-powered meta title, description, and structured data generation" badge="AI" />
        <FeatureCard title="Content Preview" desc="Real-time preview across devices and channels before publishing" />
        <FeatureCard title="Approval Workflows" desc="Multi-stage approval chains with notifications and deadlines" />
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Security Score" value="A+" change="OWASP Top 10 clean" />
        <MetricCard label="Vulnerabilities" value="0 Critical" change="Last scan: 2h ago" />
        <MetricCard label="Compliance" value="SOC 2" change="Type II certified" />
        <MetricCard label="Encryptions" value="AES-256" change="At rest & in transit" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="OWASP Vulnerability Scan" desc="Automated scanning for OWASP Top 10 and SANS Top 25 vulnerabilities" />
        <FeatureCard title="SOC 2 / ISO 27001 Templates" desc="Compliance policy templates with control mapping and evidence collection" />
        <FeatureCard title="Data Encryption" desc="AES-256 encryption at rest, TLS 1.3 in transit, with key rotation" />
        <FeatureCard title="Key Management" desc="AWS KMS and HashiCorp Vault integration for secret lifecycle management" />
        <FeatureCard title="Zero-Trust Architecture" desc="Identity-based access with micro-segmentation and continuous verification" />
        <FeatureCard title="Security Incident Response" desc="Automated playbooks for common incident types with escalation paths" />
        <FeatureCard title="PCI DSS Compliance" desc="Payment card data protection templates and control documentation" />
        <FeatureCard title="Privacy Policy Generator" desc="GDPR and CCPA compliant privacy policy generation with custom clauses" badge="AI" />
        <FeatureCard title="Penetration Testing" desc="Scheduled automated pen testing with detailed remediation reports" />
      </div>
    </div>
  );
}

function DeploymentTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Cloud Providers" value="3" change="AWS, Azure, GCP" />
        <MetricCard label="Deployments Today" value="47" change="+8 vs yesterday" />
        <MetricCard label="Success Rate" value="99.6%" change="Last 30 days" />
        <MetricCard label="Rollback Time" value="< 30s" change="Automated rollback" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Multi-Cloud Deployment" desc="Deploy to AWS, Azure, and GCP simultaneously with unified orchestration" />
        <FeatureCard title="Kubernetes Orchestration" desc="Helm charts, auto-scaling, rolling updates, and health checks" />
        <FeatureCard title="Docker Swarm" desc="Multi-node Docker Swarm setup with overlay networking and secrets" />
        <FeatureCard title="Blue-Green Deployment" desc="Zero-downtime deployments with instant rollback capabilities" />
        <FeatureCard title="Canary Deployments" desc="Gradual traffic shifting with automated rollback on error thresholds" />
        <FeatureCard title="Serverless Optimization" desc="Lambda, Cloud Functions, and Azure Functions with cold-start reduction" />
        <FeatureCard title="Edge Device Deployment" desc="Deploy to IoT and edge devices with OTA update management" />
        <FeatureCard title="Hybrid Cloud Setup" desc="On-premise and cloud hybrid architecture with private connectivity" />
        <FeatureCard title="Infrastructure Monitoring" desc="Terraform state monitoring with drift detection and auto-remediation" />
      </div>
    </div>
  );
}

function APIManagementTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="API Endpoints" value="248" change="+18 this sprint" />
        <MetricCard label="Requests/Min" value="12,400" change="Current throughput" />
        <MetricCard label="Avg Latency" value="68ms" change="P95 response time" />
        <MetricCard label="API Keys Active" value="384" change="Across all services" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="API Gateway (Kong)" desc="Kong gateway with plugins for auth, rate limiting, and transformation" />
        <FeatureCard title="AWS API Gateway" desc="REST and HTTP API gateway setup with Lambda integration" />
        <FeatureCard title="Rate Limiting & Throttling" desc="Per-key and per-IP rate limits with burst allowance and quotas" />
        <FeatureCard title="OpenAPI / Swagger Docs" desc="Auto-generated API documentation with try-it-out functionality" badge="AI" />
        <FeatureCard title="GraphQL Federation" desc="Apollo Federation with subgraph routing and schema stitching" />
        <FeatureCard title="gRPC Support" desc="Protobuf schema generation and gRPC-Web gateway for browsers" />
        <FeatureCard title="WebSocket Setup" desc="Socket.io and native WebSocket server with room management" />
        <FeatureCard title="OAuth 2.0 / OIDC" desc="Authorization server with PKCE, refresh tokens, and JWKS endpoint" />
        <FeatureCard title="API Analytics Dashboard" desc="Request metrics, error rates, and latency percentiles per endpoint" />
      </div>
    </div>
  );
}

function DataTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Data Sources" value="32" change="Connected pipelines" />
        <MetricCard label="Records Processed" value="4.2M/day" change="+12% growth" />
        <MetricCard label="Data Quality" value="99.1%" change="Validation pass rate" />
        <MetricCard label="Storage Used" value="2.8TB" change="Across all stores" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="ETL/ELT Pipelines" desc="Visual pipeline builder with 100+ connectors and transformations" />
        <FeatureCard title="Data Warehouse (BigQuery)" desc="BigQuery and Snowflake setup with partitioning and clustering" />
        <FeatureCard title="Data Lake Architecture" desc="S3/GCS/ADLS data lake with Delta Lake and Iceberg table formats" />
        <FeatureCard title="Kafka Streaming" desc="Real-time data streaming with schema registry and consumer groups" />
        <FeatureCard title="Data Validation Rules" desc="Great Expectations integration with automated data quality checks" />
        <FeatureCard title="GDPR/CCPA Compliance" desc="Data lineage tracking, PII detection, and right-to-delete workflows" />
        <FeatureCard title="Data Quality Monitoring" desc="Anomaly detection on data distributions with alert notifications" badge="AI" />
        <FeatureCard title="Backup & Replication" desc="Cross-region replication with point-in-time recovery and geo-failover" />
        <FeatureCard title="Master Data Management" desc="Golden record management with deduplication and entity resolution" />
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="DAU" value="8,423" change="+14% month-over-month" />
        <MetricCard label="Retention (D7)" value="64%" change="+6% vs last month" />
        <MetricCard label="Conversion Rate" value="3.8%" change="+0.4% this week" />
        <MetricCard label="Revenue/User" value="$24.60" change="+$2.10 vs last period" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="BI Dashboard" desc="Drag-and-drop business intelligence dashboard with 40+ chart types" />
        <FeatureCard title="Custom Report Builder" desc="SQL and visual query builder for ad-hoc reporting and scheduling" />
        <FeatureCard title="Real-Time Analytics" desc="Sub-second analytics with WebSocket streaming and live charts" />
        <FeatureCard title="Predictive Analytics" desc="ML-powered forecasting for revenue, churn, and user growth" badge="AI" />
        <FeatureCard title="Cohort Analysis" desc="User cohort tracking with retention curves and behavioral segments" />
        <FeatureCard title="Funnel Analysis" desc="Multi-step conversion funnel builder with drop-off identification" />
        <FeatureCard title="Retention Analysis" desc="Day-1, day-7, day-30 retention with segmentation and filtering" />
        <FeatureCard title="Custom Metrics" desc="Define and track custom KPIs with alerting and forecasting" />
        <FeatureCard title="Data Visualization Library" desc="Recharts, D3.js, and Vega-Lite integration with theming support" />
      </div>
    </div>
  );
}

function WorkflowTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Workflows" value="84" change="+12 this week" />
        <MetricCard label="Executions Today" value="2,847" change="All workflows" />
        <MetricCard label="Success Rate" value="99.2%" change="Last 7 days" />
        <MetricCard label="Integrations" value="100+" change="Connected services" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FeatureCard title="Visual Workflow Builder" desc="Drag-and-drop workflow designer with conditional branches and loops" />
        <FeatureCard title="Task Automation" desc="Pre-built automation templates for 100+ common task patterns" />
        <FeatureCard title="Scheduled Jobs" desc="Cron-based and interval job scheduling with timezone support" />
        <FeatureCard title="Event-Driven Automation" desc="Webhook triggers, database events, and message queue integration" />
        <FeatureCard title="Multi-Step Workflows" desc="Complex workflow chains with parallel execution and fan-out/fan-in" />
        <FeatureCard title="Error Handling & Retries" desc="Exponential backoff, dead-letter queues, and error notifications" />
        <FeatureCard title="100+ Service Integrations" desc="Slack, Jira, HubSpot, Stripe, and 96 more pre-built connectors" />
        <FeatureCard title="Conditional Logic" desc="If/else, switch, and filter nodes with expression language" />
        <FeatureCard title="Workflow Analytics" desc="Execution history, performance metrics, and failure analysis" />
      </div>
    </div>
  );
}

const tabContent: Record<string, React.ReactNode> = {
  overview: <OverviewTab />,
  search: <SearchTab />,
  monitoring: <MonitoringTab />,
  web3: <Web3Tab />,
  testing: <TestingTab />,
  performance: <PerformanceTab />,
  voice: <VoiceTab />,
  xr: <XRTab />,
  ml: <MLTab />,
  cms: <CMSTab />,
  security: <SecurityTab />,
  deployment: <DeploymentTab />,
  "api-management": <APIManagementTab />,
  data: <DataTab />,
  analytics: <AnalyticsTab />,
  workflow: <WorkflowTab />,
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-black tracking-tight hover:text-white/80 transition-colors">
            ZIVO AI
          </Link>
          <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-medium">ULTIMATE</span>
          <span className="text-white/30">/</span>
          <span className="text-sm text-white/60">Dashboard</span>
        </div>
        <nav className="flex gap-4 text-sm text-white/70">
          <Link href="/ai" className="hover:text-white transition-colors">AI Builder</Link>
          <Link href="/ai-login" className="hover:text-white transition-colors">Settings</Link>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border-r border-white/10 py-4 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left ${
                activeTab === tab.id
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {tabs.find((t) => t.id === activeTab)?.icon}{" "}
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>
            {tabContent[activeTab]}
          </div>
        </main>
      </div>
    </div>
  );
}
