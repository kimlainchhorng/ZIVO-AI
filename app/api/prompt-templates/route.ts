import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PROMPT_TEMPLATES = [
  {
    id: 'saas-landing',
    title: 'SaaS Landing Page',
    description: 'A modern SaaS landing page with hero, features, pricing, and CTA sections',
    prompt: 'Build a modern SaaS landing page with a compelling hero section, feature highlights, pricing tiers, customer testimonials, and a strong call-to-action. Include a navigation bar and footer.',
    icon: '🚀',
    tags: ['saas', 'landing'],
  },
  {
    id: 'ride-share',
    title: 'Ride-Share App',
    description: 'A ride-share app UI with home, ride request, tracking, and payment screens',
    prompt: 'Build a ride-share app UI with a home screen showing nearby drivers, a ride request form, real-time tracking view, ride history dashboard, and payment/wallet screen.',
    icon: '🚗',
    tags: ['mobile', 'app', 'transportation'],
  },
  {
    id: 'restaurant',
    title: 'Restaurant App',
    description: 'A restaurant app with menu, reservations, about, and contact pages',
    prompt: 'Build a restaurant app with a beautiful menu page, table reservation system, about us story page, chef profiles, gallery, and contact information.',
    icon: '��️',
    tags: ['restaurant', 'food', 'booking'],
  },
  {
    id: 'delivery-dashboard',
    title: 'Delivery Dashboard',
    description: 'A delivery management dashboard with orders, tracking, analytics, and driver management',
    prompt: 'Build a delivery management dashboard with active orders list, real-time package tracking, analytics charts for deliveries, driver management panel, and customer notifications center.',
    icon: '📦',
    tags: ['dashboard', 'logistics', 'analytics'],
  },
  {
    id: 'luxury-brand',
    title: 'Luxury Brand Homepage',
    description: 'An ultra-premium luxury brand homepage with hero, collections, about, and contact',
    prompt: 'Build an ultra-premium luxury brand homepage with a cinematic hero section, curated collections showcase, brand heritage story, artisan craftsmanship details, and exclusive contact form.',
    icon: '💎',
    tags: ['luxury', 'brand', 'ecommerce'],
  },
  {
    id: 'startup',
    title: 'Startup Homepage',
    description: 'A modern startup homepage with hero, product features, team, testimonials, pricing, and CTA',
    prompt: 'Build a modern startup homepage with an impactful hero section, product feature highlights, founding team profiles, customer testimonials, transparent pricing plans, and a compelling call-to-action.',
    icon: '⚡',
    tags: ['startup', 'saas', 'landing'],
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce Store',
    description: 'An e-commerce store with product grid, product detail, cart, and checkout pages',
    prompt: 'Build an e-commerce store with a product grid homepage, individual product detail pages, shopping cart, checkout flow, order confirmation, and user account dashboard.',
    icon: '🛍️',
    tags: ['ecommerce', 'shop', 'retail'],
  },
  {
    id: 'portfolio',
    title: 'Creative Portfolio',
    description: 'A creative portfolio with hero, work showcase, about, skills, and contact sections',
    prompt: 'Build a creative portfolio website with a bold hero introduction, curated work showcase grid, personal about section with story, skills and expertise visualization, and contact form.',
    icon: '🎨',
    tags: ['portfolio', 'creative', 'personal'],
  },
];

export async function GET() {
  return NextResponse.json({ templates: PROMPT_TEMPLATES });
}
