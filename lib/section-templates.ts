import type { Section } from '@/types/builder';

export type SectionTemplateConfig = {
  variant: string;
  label: string;
  defaultSection: Omit<Section, 'id' | 'order' | 'visible' | 'locked'>;
};

export const sectionTemplates: Record<string, SectionTemplateConfig[]> = {
  hero: [
    {
      variant: 'centered',
      label: 'Centered Hero',
      defaultSection: {
        type: 'hero',
        title: 'Build Something Amazing',
        content: '<div class="text-center py-24 px-4"><h1 class="text-5xl font-bold mb-4">Build Something Amazing</h1><p class="text-xl text-muted mb-8">The all-in-one platform to create, launch, and scale your ideas.</p><button class="btn-primary px-8 py-3 rounded-lg text-lg">Get Started Free</button></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'lg',
        fontSize: 'xl',
        borderRadius: 'md',
      },
    },
    {
      variant: 'split',
      label: 'Split Hero',
      defaultSection: {
        type: 'hero',
        title: 'Transform Your Workflow',
        content: '<div class="grid grid-cols-2 gap-12 py-20 px-8 items-center"><div><h1 class="text-4xl font-bold mb-4">Transform Your Workflow</h1><p class="text-lg text-muted mb-6">Automate repetitive tasks and focus on what matters most.</p><button class="btn-primary px-6 py-3 rounded-lg">Start Free Trial</button></div><div class="rounded-xl overflow-hidden"><img src="/hero-image.png" alt="Hero" class="w-full" /></div></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'lg',
        fontSize: 'lg',
        borderRadius: 'lg',
      },
    },
  ],
  features: [
    {
      variant: 'grid',
      label: 'Feature Grid',
      defaultSection: {
        type: 'features',
        title: 'Everything You Need',
        content: '<div class="py-20 px-8"><h2 class="text-3xl font-bold text-center mb-12">Everything You Need</h2><div class="grid grid-cols-3 gap-8"><div class="card p-6 rounded-xl"><div class="icon mb-4">⚡</div><h3 class="text-lg font-semibold mb-2">Lightning Fast</h3><p class="text-muted">Optimized for performance from day one.</p></div><div class="card p-6 rounded-xl"><div class="icon mb-4">🔒</div><h3 class="text-lg font-semibold mb-2">Secure by Default</h3><p class="text-muted">Enterprise-grade security built in.</p></div><div class="card p-6 rounded-xl"><div class="icon mb-4">🚀</div><h3 class="text-lg font-semibold mb-2">Easy Deploy</h3><p class="text-muted">Ship to production in one click.</p></div></div></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'md',
        borderRadius: 'lg',
      },
    },
    {
      variant: 'list',
      label: 'Feature List',
      defaultSection: {
        type: 'features',
        title: 'Key Features',
        content: '<div class="py-20 px-8 max-w-3xl mx-auto"><h2 class="text-3xl font-bold mb-10">Key Features</h2><ul class="space-y-6"><li class="flex gap-4 items-start"><span class="text-accent text-xl">✓</span><div><h3 class="font-semibold mb-1">Real-time Collaboration</h3><p class="text-muted">Work with your team simultaneously.</p></div></li><li class="flex gap-4 items-start"><span class="text-accent text-xl">✓</span><div><h3 class="font-semibold mb-1">AI-Powered Insights</h3><p class="text-muted">Get smart suggestions automatically.</p></div></li></ul></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'lg',
        fontSize: 'md',
        borderRadius: 'md',
      },
    },
  ],
  pricing: [
    {
      variant: 'cards',
      label: 'Pricing Cards',
      defaultSection: {
        type: 'pricing',
        title: 'Simple Pricing',
        content: '<div class="py-20 px-8"><h2 class="text-3xl font-bold text-center mb-12">Simple Pricing</h2><div class="grid grid-cols-3 gap-8 max-w-5xl mx-auto"><div class="card p-8 rounded-xl border"><h3 class="text-xl font-bold mb-2">Starter</h3><div class="text-4xl font-bold mb-6">$9<span class="text-lg text-muted">/mo</span></div><ul class="space-y-3 mb-8"><li>5 Projects</li><li>10GB Storage</li><li>Email Support</li></ul><button class="w-full btn-outline py-2 rounded-lg">Get Started</button></div><div class="card p-8 rounded-xl border border-accent"><h3 class="text-xl font-bold mb-2">Pro</h3><div class="text-4xl font-bold mb-6">$29<span class="text-lg text-muted">/mo</span></div><ul class="space-y-3 mb-8"><li>Unlimited Projects</li><li>100GB Storage</li><li>Priority Support</li></ul><button class="w-full btn-primary py-2 rounded-lg">Get Started</button></div><div class="card p-8 rounded-xl border"><h3 class="text-xl font-bold mb-2">Enterprise</h3><div class="text-4xl font-bold mb-6">Custom</div><ul class="space-y-3 mb-8"><li>Unlimited Everything</li><li>SLA Guarantee</li><li>Dedicated Support</li></ul><button class="w-full btn-outline py-2 rounded-lg">Contact Us</button></div></div></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'md',
        borderRadius: 'lg',
      },
    },
    {
      variant: 'toggle',
      label: 'Pricing Toggle',
      defaultSection: {
        type: 'pricing',
        title: 'Choose Your Plan',
        content: '<div class="py-20 px-8 text-center"><h2 class="text-3xl font-bold mb-4">Choose Your Plan</h2><p class="text-muted mb-8">Save 20% with annual billing</p><div class="inline-flex bg-surface rounded-full p-1 mb-12"><button class="px-6 py-2 rounded-full bg-accent text-white">Monthly</button><button class="px-6 py-2 rounded-full text-muted">Annual</button></div></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'md',
        borderRadius: 'full',
      },
    },
  ],
  testimonials: [
    {
      variant: 'carousel',
      label: 'Testimonial Carousel',
      defaultSection: {
        type: 'testimonials',
        title: 'What Our Customers Say',
        content: '<div class="py-20 px-8 text-center"><h2 class="text-3xl font-bold mb-12">What Our Customers Say</h2><div class="max-w-2xl mx-auto card p-10 rounded-2xl"><p class="text-xl italic mb-6">"This platform transformed how we build products. We ship 3x faster now."</p><div class="flex items-center justify-center gap-3"><img src="/avatar.jpg" class="w-10 h-10 rounded-full" /><div class="text-left"><div class="font-semibold">Sarah Chen</div><div class="text-muted text-sm">CTO at Acme Inc</div></div></div></div></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'lg',
        borderRadius: 'xl',
      },
    },
    {
      variant: 'grid',
      label: 'Testimonial Grid',
      defaultSection: {
        type: 'testimonials',
        title: 'Loved by Teams',
        content: '<div class="py-20 px-8"><h2 class="text-3xl font-bold text-center mb-12">Loved by Teams</h2><div class="grid grid-cols-2 gap-6 max-w-4xl mx-auto"><div class="card p-6 rounded-xl"><p class="mb-4 italic">"Incredible product. Changed our workflow."</p><div class="font-semibold">Alex Johnson</div><div class="text-muted text-sm">Founder, StartupXYZ</div></div><div class="card p-6 rounded-xl"><p class="mb-4 italic">"Best investment we made this year."</p><div class="font-semibold">Maria Garcia</div><div class="text-muted text-sm">PM at TechCorp</div></div></div></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'lg',
        fontSize: 'md',
        borderRadius: 'lg',
      },
    },
  ],
  faq: [
    {
      variant: 'accordion',
      label: 'FAQ Accordion',
      defaultSection: {
        type: 'faq',
        title: 'Frequently Asked Questions',
        content: '<div class="py-20 px-8 max-w-3xl mx-auto"><h2 class="text-3xl font-bold mb-12">Frequently Asked Questions</h2><div class="space-y-4"><details class="card p-6 rounded-xl"><summary class="font-semibold cursor-pointer">How do I get started?</summary><p class="mt-3 text-muted">Sign up for a free account and follow our quick start guide.</p></details><details class="card p-6 rounded-xl"><summary class="font-semibold cursor-pointer">Can I cancel anytime?</summary><p class="mt-3 text-muted">Yes, you can cancel your subscription at any time with no questions asked.</p></details><details class="card p-6 rounded-xl"><summary class="font-semibold cursor-pointer">Is there a free trial?</summary><p class="mt-3 text-muted">Yes, we offer a 14-day free trial with full access to all features.</p></details></div></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'md',
        borderRadius: 'lg',
      },
    },
    {
      variant: 'two-column',
      label: 'FAQ Two Column',
      defaultSection: {
        type: 'faq',
        title: 'Common Questions',
        content: '<div class="py-20 px-8"><h2 class="text-3xl font-bold text-center mb-12">Common Questions</h2><div class="grid grid-cols-2 gap-8 max-w-5xl mx-auto"><div><h3 class="font-semibold mb-2">What platforms do you support?</h3><p class="text-muted mb-6">We support all major platforms including web, iOS, and Android.</p><h3 class="font-semibold mb-2">How secure is my data?</h3><p class="text-muted">All data is encrypted at rest and in transit using AES-256.</p></div><div><h3 class="font-semibold mb-2">Do you offer custom plans?</h3><p class="text-muted mb-6">Yes, contact our sales team for custom enterprise plans.</p><h3 class="font-semibold mb-2">What&apos;s your uptime SLA?</h3><p class="text-muted">We guarantee 99.9% uptime for all paid plans.</p></div></div></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'lg',
        fontSize: 'md',
        borderRadius: 'md',
      },
    },
  ],
  contact: [
    {
      variant: 'form',
      label: 'Contact Form',
      defaultSection: {
        type: 'contact',
        title: 'Get in Touch',
        content: '<div class="py-20 px-8 max-w-2xl mx-auto"><h2 class="text-3xl font-bold mb-4">Get in Touch</h2><p class="text-muted mb-8">Have a question? We\'d love to hear from you.</p><form class="space-y-6"><div><label class="block mb-2 font-medium">Name</label><input type="text" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Your name" /></div><div><label class="block mb-2 font-medium">Email</label><input type="email" class="w-full input-field px-4 py-3 rounded-lg" placeholder="you@example.com" /></div><div><label class="block mb-2 font-medium">Message</label><textarea rows="5" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Your message..."></textarea></div><button type="submit" class="btn-primary px-8 py-3 rounded-lg w-full">Send Message</button></form></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'md',
        borderRadius: 'lg',
      },
    },
    {
      variant: 'split',
      label: 'Contact Split',
      defaultSection: {
        type: 'contact',
        title: 'Contact Us',
        content: '<div class="grid grid-cols-2 gap-12 py-20 px-8"><div><h2 class="text-3xl font-bold mb-4">Contact Us</h2><p class="text-muted mb-8">Reach out anytime. Our team responds within 24 hours.</p><div class="space-y-4"><div>📧 hello@example.com</div><div>📞 +1 (555) 000-0000</div><div>📍 San Francisco, CA</div></div></div><form class="space-y-4"><input type="text" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Name" /><input type="email" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Email" /><textarea rows="4" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Message"></textarea><button class="btn-primary px-6 py-3 rounded-lg w-full">Send</button></form></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'lg',
        fontSize: 'md',
        borderRadius: 'md',
      },
    },
  ],
  dashboard_cards: [
    {
      variant: 'stats',
      label: 'Dashboard Stats',
      defaultSection: {
        type: 'dashboard_cards',
        title: 'Dashboard Overview',
        content: '<div class="p-6"><h2 class="text-2xl font-bold mb-6">Dashboard Overview</h2><div class="grid grid-cols-4 gap-4"><div class="card p-6 rounded-xl"><div class="text-muted text-sm mb-1">Total Revenue</div><div class="text-3xl font-bold">$48,295</div><div class="text-green-400 text-sm mt-1">↑ 12% this month</div></div><div class="card p-6 rounded-xl"><div class="text-muted text-sm mb-1">Active Users</div><div class="text-3xl font-bold">3,842</div><div class="text-green-400 text-sm mt-1">↑ 8% this month</div></div><div class="card p-6 rounded-xl"><div class="text-muted text-sm mb-1">Conversions</div><div class="text-3xl font-bold">24.5%</div><div class="text-red-400 text-sm mt-1">↓ 2% this month</div></div><div class="card p-6 rounded-xl"><div class="text-muted text-sm mb-1">Avg Session</div><div class="text-3xl font-bold">4m 32s</div><div class="text-green-400 text-sm mt-1">↑ 5% this month</div></div></div></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'md',
        fontSize: 'md',
        borderRadius: 'lg',
      },
    },
    {
      variant: 'table',
      label: 'Dashboard Table',
      defaultSection: {
        type: 'dashboard_cards',
        title: 'Recent Activity',
        content: '<div class="p-6"><h2 class="text-xl font-bold mb-4">Recent Activity</h2><table class="w-full"><thead><tr class="border-b border-border"><th class="text-left py-3 text-muted font-medium">User</th><th class="text-left py-3 text-muted font-medium">Action</th><th class="text-left py-3 text-muted font-medium">Date</th><th class="text-left py-3 text-muted font-medium">Status</th></tr></thead><tbody><tr class="border-b border-border"><td class="py-3">Alice Smith</td><td class="py-3">Created project</td><td class="py-3">Today</td><td class="py-3"><span class="badge-success">Active</span></td></tr><tr class="border-b border-border"><td class="py-3">Bob Johnson</td><td class="py-3">Deployed app</td><td class="py-3">Yesterday</td><td class="py-3"><span class="badge-success">Success</span></td></tr></tbody></table></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'md',
        fontSize: 'sm',
        borderRadius: 'md',
      },
    },
  ],
  login_signup: [
    {
      variant: 'centered',
      label: 'Centered Login',
      defaultSection: {
        type: 'login_signup',
        title: 'Sign In',
        content: '<div class="min-h-screen flex items-center justify-center"><div class="card p-10 rounded-2xl w-full max-w-md"><h2 class="text-2xl font-bold mb-2">Welcome back</h2><p class="text-muted mb-8">Sign in to your account</p><form class="space-y-4"><div><label class="block mb-2 font-medium">Email</label><input type="email" class="w-full input-field px-4 py-3 rounded-lg" placeholder="you@example.com" /></div><div><label class="block mb-2 font-medium">Password</label><input type="password" class="w-full input-field px-4 py-3 rounded-lg" placeholder="••••••••" /></div><button class="btn-primary w-full py-3 rounded-lg font-semibold">Sign In</button></form><p class="text-center mt-6 text-muted">Don&apos;t have an account? <a href="#" class="text-accent">Sign up</a></p></div></div>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'md',
        borderRadius: 'xl',
      },
    },
    {
      variant: 'split',
      label: 'Split Login',
      defaultSection: {
        type: 'login_signup',
        title: 'Create Account',
        content: '<div class="grid grid-cols-2 min-h-screen"><div class="bg-accent-gradient flex items-center justify-center p-12"><div><h1 class="text-4xl font-bold text-white mb-4">Start Building Today</h1><p class="text-white/70 text-lg">Join thousands of developers building the future.</p></div></div><div class="flex items-center justify-center p-12"><div class="w-full max-w-sm"><h2 class="text-2xl font-bold mb-8">Create your account</h2><form class="space-y-4"><input type="text" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Full name" /><input type="email" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Email" /><input type="password" class="w-full input-field px-4 py-3 rounded-lg" placeholder="Password" /><button class="btn-primary w-full py-3 rounded-lg">Create Account</button></form></div></div></div>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'md',
        borderRadius: 'lg',
      },
    },
  ],
  navigation: [
    {
      variant: 'transparent',
      label: 'Transparent Nav',
      defaultSection: {
        type: 'navigation',
        title: 'Navigation',
        content: '<nav class="flex items-center justify-between px-8 py-4"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-accent rounded-lg"></div><span class="font-bold text-lg">Brand</span></div><div class="flex items-center gap-8"><a href="#" class="text-muted hover:text-primary">Features</a><a href="#" class="text-muted hover:text-primary">Pricing</a><a href="#" class="text-muted hover:text-primary">Docs</a><a href="#" class="text-muted hover:text-primary">Blog</a></div><div class="flex items-center gap-3"><button class="btn-ghost px-4 py-2 rounded-lg">Sign In</button><button class="btn-primary px-4 py-2 rounded-lg">Get Started</button></div></nav>',
        bgColor: 'transparent',
        textColor: '#f1f5f9',
        spacing: 'sm',
        fontSize: 'sm',
        borderRadius: 'md',
      },
    },
    {
      variant: 'solid',
      label: 'Solid Nav',
      defaultSection: {
        type: 'navigation',
        title: 'Navigation',
        content: '<nav class="flex items-center justify-between px-8 py-4 bg-surface border-b border-border"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-accent rounded-lg"></div><span class="font-bold text-lg">Brand</span></div><div class="flex items-center gap-6"><a href="#" class="text-sm font-medium">Product</a><a href="#" class="text-sm font-medium">Solutions</a><a href="#" class="text-sm font-medium">Pricing</a><a href="#" class="text-sm font-medium">Company</a></div><button class="btn-primary px-4 py-2 rounded-lg text-sm">Try Free</button></nav>',
        bgColor: '#0f1120',
        textColor: '#f1f5f9',
        spacing: 'sm',
        fontSize: 'sm',
        borderRadius: 'md',
      },
    },
  ],
  footer: [
    {
      variant: 'full',
      label: 'Full Footer',
      defaultSection: {
        type: 'footer',
        title: 'Footer',
        content: '<footer class="py-16 px-8 border-t border-border"><div class="grid grid-cols-4 gap-8 mb-12"><div><div class="flex items-center gap-2 mb-4"><div class="w-8 h-8 bg-accent rounded-lg"></div><span class="font-bold">Brand</span></div><p class="text-muted text-sm">Building the future of software development.</p></div><div><h4 class="font-semibold mb-4">Product</h4><ul class="space-y-2 text-muted text-sm"><li><a href="#">Features</a></li><li><a href="#">Pricing</a></li><li><a href="#">Changelog</a></li></ul></div><div><h4 class="font-semibold mb-4">Company</h4><ul class="space-y-2 text-muted text-sm"><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Careers</a></li></ul></div><div><h4 class="font-semibold mb-4">Legal</h4><ul class="space-y-2 text-muted text-sm"><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li></ul></div></div><div class="border-t border-border pt-8 flex items-center justify-between"><p class="text-muted text-sm">© 2025 Brand. All rights reserved.</p><div class="flex gap-4 text-muted"><a href="#">Twitter</a><a href="#">GitHub</a><a href="#">LinkedIn</a></div></div></footer>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'xl',
        fontSize: 'sm',
        borderRadius: 'none',
      },
    },
    {
      variant: 'minimal',
      label: 'Minimal Footer',
      defaultSection: {
        type: 'footer',
        title: 'Footer',
        content: '<footer class="py-8 px-8 border-t border-border flex items-center justify-between"><p class="text-muted text-sm">© 2025 Brand. All rights reserved.</p><div class="flex gap-6 text-sm text-muted"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a></div></footer>',
        bgColor: '#0a0b14',
        textColor: '#f1f5f9',
        spacing: 'sm',
        fontSize: 'sm',
        borderRadius: 'none',
      },
    },
  ],
};

export function getDefaultSection(type: string, variant?: string): Omit<Section, 'id' | 'order' | 'visible' | 'locked'> {
  const templates = sectionTemplates[type];
  if (!templates || templates.length === 0) {
    return {
      type: 'custom' as Section['type'],
      title: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
      content: `<div class="py-16 px-8 text-center"><h2 class="text-2xl font-bold">${type}</h2></div>`,
      bgColor: '#0a0b14',
      textColor: '#f1f5f9',
      spacing: 'lg',
      fontSize: 'md',
      borderRadius: 'md',
    };
  }
  const template = variant
    ? (templates.find((t) => t.variant === variant) ?? templates[0])
    : templates[0];
  return template.defaultSection;
}
