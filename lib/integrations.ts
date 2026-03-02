// ZIVO AI Integration Catalog – 100+ Integrations

export interface Integration {
  name: string;
  category: string;
  description: string;
  website: string;
}

export const INTEGRATIONS: Integration[] = [
  // Development Tools
  { name: "GitHub Actions", category: "Development Tools", description: "CI/CD automation directly in GitHub repositories.", website: "https://github.com/features/actions" },
  { name: "GitLab CI/CD", category: "Development Tools", description: "Continuous integration and deployment pipelines for GitLab.", website: "https://about.gitlab.com/stages-devops-lifecycle/continuous-integration/" },
  { name: "Jenkins", category: "Development Tools", description: "Open-source automation server for CI/CD.", website: "https://www.jenkins.io" },
  { name: "CircleCI", category: "Development Tools", description: "Cloud-native CI/CD platform.", website: "https://circleci.com" },
  { name: "Travis CI", category: "Development Tools", description: "Hosted continuous integration for GitHub projects.", website: "https://www.travis-ci.com" },
  { name: "Docker", category: "Development Tools", description: "Container platform for building and running applications.", website: "https://www.docker.com" },
  { name: "Kubernetes", category: "Development Tools", description: "Container orchestration system.", website: "https://kubernetes.io" },
  { name: "Terraform", category: "Development Tools", description: "Infrastructure-as-code tool.", website: "https://www.terraform.io" },
  { name: "ArgoCD", category: "Development Tools", description: "Declarative GitOps CD for Kubernetes.", website: "https://argoproj.github.io/cd/" },
  { name: "Helm", category: "Development Tools", description: "Kubernetes package manager.", website: "https://helm.sh" },

  // Business Tools
  { name: "Salesforce", category: "Business Tools", description: "World's #1 CRM platform.", website: "https://www.salesforce.com" },
  { name: "HubSpot", category: "Business Tools", description: "Inbound marketing and sales platform.", website: "https://www.hubspot.com" },
  { name: "Intercom", category: "Business Tools", description: "Customer messaging platform.", website: "https://www.intercom.com" },
  { name: "Zendesk", category: "Business Tools", description: "Customer service and support platform.", website: "https://www.zendesk.com" },
  { name: "Jira", category: "Business Tools", description: "Issue and project tracking by Atlassian.", website: "https://www.atlassian.com/software/jira" },
  { name: "Asana", category: "Business Tools", description: "Work management platform.", website: "https://asana.com" },
  { name: "Monday.com", category: "Business Tools", description: "Work OS for teams.", website: "https://monday.com" },
  { name: "Notion", category: "Business Tools", description: "All-in-one workspace for notes and collaboration.", website: "https://www.notion.so" },
  { name: "ClickUp", category: "Business Tools", description: "Project management and productivity platform.", website: "https://clickup.com" },
  { name: "Linear", category: "Business Tools", description: "Issue tracking for software teams.", website: "https://linear.app" },

  // Financial
  { name: "Stripe", category: "Financial", description: "Payment processing platform.", website: "https://stripe.com" },
  { name: "Square", category: "Financial", description: "Payment and point-of-sale solutions.", website: "https://squareup.com" },
  { name: "PayPal", category: "Financial", description: "Online payments and money transfers.", website: "https://www.paypal.com" },
  { name: "Plaid", category: "Financial", description: "Financial data network.", website: "https://plaid.com" },
  { name: "QuickBooks", category: "Financial", description: "Accounting software for small businesses.", website: "https://quickbooks.intuit.com" },
  { name: "Xero", category: "Financial", description: "Cloud accounting software.", website: "https://www.xero.com" },
  { name: "Wise", category: "Financial", description: "International money transfer service.", website: "https://wise.com" },
  { name: "Crypto Exchanges", category: "Financial", description: "Integration with major crypto exchanges (Binance, Coinbase, etc.).", website: "https://www.binance.com" },
  { name: "FreshBooks", category: "Financial", description: "Cloud-based accounting and invoicing.", website: "https://www.freshbooks.com" },
  { name: "Wave", category: "Financial", description: "Free accounting software.", website: "https://www.waveapps.com" },

  // Communication
  { name: "Twilio", category: "Communication", description: "Cloud communications platform (SMS, voice, video).", website: "https://www.twilio.com" },
  { name: "SendGrid", category: "Communication", description: "Email delivery service.", website: "https://sendgrid.com" },
  { name: "Mailgun", category: "Communication", description: "Email API service.", website: "https://www.mailgun.com" },
  { name: "Firebase", category: "Communication", description: "Google's mobile and web development platform.", website: "https://firebase.google.com" },
  { name: "Socket.io", category: "Communication", description: "Real-time bidirectional event-based communication.", website: "https://socket.io" },
  { name: "Pusher", category: "Communication", description: "Hosted APIs for real-time apps.", website: "https://pusher.com" },
  { name: "Agora", category: "Communication", description: "Real-time voice and video engagement platform.", website: "https://www.agora.io" },
  { name: "Daily.co", category: "Communication", description: "Video call API.", website: "https://www.daily.co" },
  { name: "Vonage", category: "Communication", description: "Cloud communications APIs.", website: "https://www.vonage.com" },
  { name: "Amazon SNS", category: "Communication", description: "Managed messaging service by AWS.", website: "https://aws.amazon.com/sns/" },

  // Marketing
  { name: "Google Analytics", category: "Marketing", description: "Web analytics service.", website: "https://analytics.google.com" },
  { name: "Mixpanel", category: "Marketing", description: "Product analytics platform.", website: "https://mixpanel.com" },
  { name: "Amplitude", category: "Marketing", description: "Digital analytics platform.", website: "https://amplitude.com" },
  { name: "Segment", category: "Marketing", description: "Customer data platform.", website: "https://segment.com" },
  { name: "Marketo", category: "Marketing", description: "Marketing automation platform.", website: "https://www.marketo.com" },
  { name: "Adobe Experience", category: "Marketing", description: "Adobe Experience Cloud marketing tools.", website: "https://business.adobe.com" },
  { name: "Klaviyo", category: "Marketing", description: "Email and SMS marketing platform.", website: "https://www.klaviyo.com" },
  { name: "Heap", category: "Marketing", description: "Product analytics with automatic event capture.", website: "https://heap.io" },
  { name: "Hotjar", category: "Marketing", description: "Website heatmaps and behavior analytics.", website: "https://www.hotjar.com" },

  // E-Commerce
  { name: "Shopify", category: "E-Commerce", description: "E-commerce platform.", website: "https://www.shopify.com" },
  { name: "WooCommerce", category: "E-Commerce", description: "WordPress e-commerce plugin.", website: "https://woocommerce.com" },
  { name: "BigCommerce", category: "E-Commerce", description: "E-commerce platform for growing businesses.", website: "https://www.bigcommerce.com" },
  { name: "Magento", category: "E-Commerce", description: "Open-source e-commerce platform.", website: "https://magento.com" },
  { name: "Etsy", category: "E-Commerce", description: "Marketplace for handmade and vintage items.", website: "https://www.etsy.com" },
  { name: "Amazon", category: "E-Commerce", description: "Amazon Marketplace and AWS integration.", website: "https://www.amazon.com" },
  { name: "eBay", category: "E-Commerce", description: "Online marketplace.", website: "https://www.ebay.com" },
  { name: "Printful", category: "E-Commerce", description: "Print-on-demand dropshipping.", website: "https://www.printful.com" },
  { name: "Gumroad", category: "E-Commerce", description: "Platform for selling digital products.", website: "https://gumroad.com" },
  { name: "Sellfy", category: "E-Commerce", description: "E-commerce for creators.", website: "https://sellfy.com" },

  // Content
  { name: "WordPress", category: "Content", description: "Open-source CMS.", website: "https://wordpress.com" },
  { name: "Contentful", category: "Content", description: "Headless CMS platform.", website: "https://www.contentful.com" },
  { name: "Sanity", category: "Content", description: "Headless CMS with real-time collaboration.", website: "https://www.sanity.io" },
  { name: "Strapi", category: "Content", description: "Open-source headless CMS.", website: "https://strapi.io" },
  { name: "Ghost", category: "Content", description: "Publishing platform for newsletters and blogs.", website: "https://ghost.org" },
  { name: "Medium", category: "Content", description: "Online publishing platform.", website: "https://medium.com" },
  { name: "Dev.to", category: "Content", description: "Community for software developers.", website: "https://dev.to" },
  { name: "Hashnode", category: "Content", description: "Blogging platform for developers.", website: "https://hashnode.com" },
  { name: "Substack", category: "Content", description: "Platform for subscription newsletters.", website: "https://substack.com" },
  { name: "Beehiiv", category: "Content", description: "Newsletter platform for growth.", website: "https://www.beehiiv.com" },

  // Media
  { name: "YouTube", category: "Media", description: "Video sharing and streaming platform.", website: "https://www.youtube.com" },
  { name: "Vimeo", category: "Media", description: "Video hosting platform.", website: "https://vimeo.com" },
  { name: "Cloudinary", category: "Media", description: "Image and video management in the cloud.", website: "https://cloudinary.com" },
  { name: "Mux", category: "Media", description: "API-first video platform.", website: "https://www.mux.com" },
  { name: "AWS MediaConvert", category: "Media", description: "File-based video transcoding service.", website: "https://aws.amazon.com/mediaconvert/" },
  { name: "Bunny CDN", category: "Media", description: "Fast and affordable content delivery.", website: "https://bunny.net" },
  { name: "Firebase Storage", category: "Media", description: "Object storage for Firebase apps.", website: "https://firebase.google.com/products/storage" },
  { name: "AWS S3", category: "Media", description: "Scalable object storage by AWS.", website: "https://aws.amazon.com/s3/" },
  { name: "Backblaze B2", category: "Media", description: "Affordable cloud object storage.", website: "https://www.backblaze.com/b2/cloud-storage.html" },

  // Cloud Providers
  { name: "AWS", category: "Cloud Providers", description: "Amazon Web Services cloud platform.", website: "https://aws.amazon.com" },
  { name: "Google Cloud", category: "Cloud Providers", description: "Google Cloud Platform.", website: "https://cloud.google.com" },
  { name: "Azure", category: "Cloud Providers", description: "Microsoft Azure cloud services.", website: "https://azure.microsoft.com" },
  { name: "DigitalOcean", category: "Cloud Providers", description: "Cloud infrastructure provider.", website: "https://www.digitalocean.com" },
  { name: "Linode", category: "Cloud Providers", description: "Cloud hosting by Akamai.", website: "https://www.linode.com" },
  { name: "Heroku", category: "Cloud Providers", description: "Cloud platform as a service.", website: "https://www.heroku.com" },
  { name: "Vercel", category: "Cloud Providers", description: "Frontend cloud platform.", website: "https://vercel.com" },
  { name: "Netlify", category: "Cloud Providers", description: "Web hosting and automation platform.", website: "https://www.netlify.com" },
  { name: "Railway", category: "Cloud Providers", description: "Infrastructure platform for deployment.", website: "https://railway.app" },
  { name: "Render", category: "Cloud Providers", description: "Cloud platform for apps and databases.", website: "https://render.com" },

  // AI/ML
  { name: "OpenAI", category: "AI/ML", description: "AI research and API platform (GPT, DALL-E, Whisper).", website: "https://openai.com" },
  { name: "Anthropic", category: "AI/ML", description: "AI safety company behind Claude.", website: "https://www.anthropic.com" },
  { name: "Cohere", category: "AI/ML", description: "NLP AI platform for enterprise.", website: "https://cohere.com" },
  { name: "Hugging Face", category: "AI/ML", description: "Open-source AI model hub.", website: "https://huggingface.co" },
  { name: "TensorFlow", category: "AI/ML", description: "Open-source machine learning framework.", website: "https://www.tensorflow.org" },
  { name: "PyTorch", category: "AI/ML", description: "Open-source machine learning library.", website: "https://pytorch.org" },
  { name: "Replicate", category: "AI/ML", description: "Run ML models via API.", website: "https://replicate.com" },
  { name: "Lambda Labs", category: "AI/ML", description: "GPU cloud for deep learning.", website: "https://lambdalabs.com" },
  { name: "Runwayml", category: "AI/ML", description: "Creative AI tools for video and image.", website: "https://runwayml.com" },
  { name: "Together AI", category: "AI/ML", description: "Fast inference for open-source AI models.", website: "https://www.together.ai" },

  // Database
  { name: "PostgreSQL", category: "Database", description: "Advanced open-source relational database.", website: "https://www.postgresql.org" },
  { name: "MySQL", category: "Database", description: "Popular open-source relational database.", website: "https://www.mysql.com" },
  { name: "MongoDB", category: "Database", description: "Document-oriented NoSQL database.", website: "https://www.mongodb.com" },
  { name: "Supabase", category: "Database", description: "Open-source Firebase alternative.", website: "https://supabase.com" },
  { name: "DynamoDB", category: "Database", description: "Serverless NoSQL database by AWS.", website: "https://aws.amazon.com/dynamodb/" },
  { name: "Elasticsearch", category: "Database", description: "Distributed search and analytics engine.", website: "https://www.elastic.co" },
  { name: "Redis", category: "Database", description: "In-memory data structure store.", website: "https://redis.io" },
  { name: "Neo4j", category: "Database", description: "Graph database platform.", website: "https://neo4j.com" },
  { name: "ClickHouse", category: "Database", description: "Fast open-source column-oriented DBMS.", website: "https://clickhouse.com" },

  // Monitoring
  { name: "Datadog", category: "Monitoring", description: "Cloud monitoring and security platform.", website: "https://www.datadoghq.com" },
  { name: "New Relic", category: "Monitoring", description: "Observability platform.", website: "https://newrelic.com" },
  { name: "Sentry", category: "Monitoring", description: "Application error monitoring.", website: "https://sentry.io" },
  { name: "LogRocket", category: "Monitoring", description: "Frontend monitoring and session replay.", website: "https://logrocket.com" },
  { name: "Grafana", category: "Monitoring", description: "Open-source analytics and monitoring.", website: "https://grafana.com" },
  { name: "Prometheus", category: "Monitoring", description: "Open-source monitoring and alerting.", website: "https://prometheus.io" },
  { name: "ELK Stack", category: "Monitoring", description: "Elasticsearch, Logstash, and Kibana stack.", website: "https://www.elastic.co/elastic-stack" },
  { name: "Splunk", category: "Monitoring", description: "Data analytics and monitoring platform.", website: "https://www.splunk.com" },
  { name: "Honeycomb", category: "Monitoring", description: "Observability for distributed systems.", website: "https://www.honeycomb.io" },
  { name: "Lightstep", category: "Monitoring", description: "Observability platform for change intelligence.", website: "https://lightstep.com" },

  // Security
  { name: "Auth0", category: "Security", description: "Identity and authentication platform.", website: "https://auth0.com" },
  { name: "Okta", category: "Security", description: "Identity and access management.", website: "https://www.okta.com" },
  { name: "AWS Cognito", category: "Security", description: "User authentication and authorization by AWS.", website: "https://aws.amazon.com/cognito/" },
  { name: "HashiCorp Vault", category: "Security", description: "Secrets management and data protection.", website: "https://www.vaultproject.io" },
  { name: "1Password", category: "Security", description: "Password manager for teams.", website: "https://1password.com" },
  { name: "Snyk", category: "Security", description: "Developer security platform.", website: "https://snyk.io" },
  { name: "Dependabot", category: "Security", description: "Automated dependency updates and security.", website: "https://github.com/dependabot" },
  { name: "GitGuardian", category: "Security", description: "Secrets detection and remediation.", website: "https://www.gitguardian.com" },

  // SEO & Performance
  { name: "Google Search Console", category: "SEO & Performance", description: "Monitor and fix site search performance.", website: "https://search.google.com/search-console" },
  { name: "SEMrush", category: "SEO & Performance", description: "Online visibility and marketing platform.", website: "https://www.semrush.com" },
  { name: "Ahrefs", category: "SEO & Performance", description: "SEO toolset for link building and analysis.", website: "https://ahrefs.com" },
  { name: "Moz", category: "SEO & Performance", description: "SEO software and tools.", website: "https://moz.com" },
  { name: "Lighthouse", category: "SEO & Performance", description: "Google's automated page quality tool.", website: "https://developers.google.com/web/tools/lighthouse" },
  { name: "WebPageTest", category: "SEO & Performance", description: "Website performance testing.", website: "https://www.webpagetest.org" },
  { name: "GTmetrix", category: "SEO & Performance", description: "Web performance analysis.", website: "https://gtmetrix.com" },
  { name: "Pingdom", category: "SEO & Performance", description: "Website monitoring service.", website: "https://www.pingdom.com" },
  { name: "Uptime Robot", category: "SEO & Performance", description: "Free website uptime monitoring.", website: "https://uptimerobot.com" },

  // CRM
  { name: "Pipedrive", category: "CRM", description: "Sales CRM and pipeline management.", website: "https://www.pipedrive.com" },
  { name: "Zoho CRM", category: "CRM", description: "CRM software for business.", website: "https://www.zoho.com/crm/" },
  { name: "Freshsales", category: "CRM", description: "AI-powered CRM by Freshworks.", website: "https://www.freshworks.com/crm/" },
  { name: "Copper", category: "CRM", description: "CRM for Google Workspace.", website: "https://www.copper.com" },
  { name: "Nutshell", category: "CRM", description: "B2B CRM and email marketing platform.", website: "https://www.nutshell.com" },
  { name: "SalesLoft", category: "CRM", description: "Revenue workflow platform.", website: "https://salesloft.com" },
  { name: "Outreach", category: "CRM", description: "Sales execution platform.", website: "https://www.outreach.io" },
  { name: "Clari", category: "CRM", description: "Revenue operations platform.", website: "https://www.clari.com" },

  // Collaboration
  { name: "Slack", category: "Collaboration", description: "Business communication platform.", website: "https://slack.com" },
  { name: "Microsoft Teams", category: "Collaboration", description: "Collaboration and communication hub.", website: "https://www.microsoft.com/en-us/microsoft-teams" },
  { name: "Discord", category: "Collaboration", description: "Voice, video, and text communication.", website: "https://discord.com" },
  { name: "Zoom", category: "Collaboration", description: "Video conferencing platform.", website: "https://zoom.us" },
  { name: "Google Meet", category: "Collaboration", description: "Video calling by Google.", website: "https://meet.google.com" },
  { name: "Miro", category: "Collaboration", description: "Online collaborative whiteboard.", website: "https://miro.com" },
  { name: "Figma", category: "Collaboration", description: "Collaborative design tool.", website: "https://www.figma.com" },
  { name: "InVision", category: "Collaboration", description: "Digital product design platform.", website: "https://www.invisionapp.com" },
  { name: "Abstract", category: "Collaboration", description: "Version control for design files.", website: "https://www.abstract.com" },
  { name: "Framer", category: "Collaboration", description: "Website and prototype builder.", website: "https://www.framer.com" },

  // Productivity / Automation
  { name: "Zapier", category: "Productivity", description: "Workflow automation between apps.", website: "https://zapier.com" },
  { name: "Make", category: "Productivity", description: "Visual automation platform (formerly Integromat).", website: "https://www.make.com" },
  { name: "n8n", category: "Productivity", description: "Open-source workflow automation.", website: "https://n8n.io" },
  { name: "IFTTT", category: "Productivity", description: "Applet-based automation service.", website: "https://ifttt.com" },
  { name: "Microsoft Power Automate", category: "Productivity", description: "Cloud-based automation service by Microsoft.", website: "https://powerautomate.microsoft.com" },
  { name: "AWS EventBridge", category: "Productivity", description: "Serverless event bus by AWS.", website: "https://aws.amazon.com/eventbridge/" },
  { name: "Kestra", category: "Productivity", description: "Open-source orchestration platform.", website: "https://kestra.io" },
];

export function getIntegrationsByCategory(category: string): Integration[] {
  return INTEGRATIONS.filter((i) => i.category === category);
}

export function getAllIntegrationCategories(): string[] {
  return [...new Set(INTEGRATIONS.map((i) => i.category))];
}

export function searchIntegrations(query: string): Integration[] {
  const q = query.toLowerCase();
  return INTEGRATIONS.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
  );
}
