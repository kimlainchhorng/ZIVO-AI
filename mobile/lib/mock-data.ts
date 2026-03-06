// mobile/lib/mock-data.ts — Realistic mock data for the generated Expo Router app

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinedAt: string;
}

export interface ListItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  rating?: number;
  price?: string;
}

export interface Stat {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export const currentUser: User = {
  id: "u_001",
  name: "Alex Rivera",
  email: "alex.rivera@example.com",
  avatar: "https://picsum.photos/id/91/200/200",
  role: "Pro Member",
  joinedAt: "January 2024",
};

export const teamMembers: User[] = [
  { id: "u_001", name: "Alex Rivera", email: "alex@example.com", avatar: "https://picsum.photos/id/91/200/200", role: "Admin", joinedAt: "Jan 2024" },
  { id: "u_002", name: "Jordan Lee", email: "jordan@example.com", avatar: "https://picsum.photos/id/92/200/200", role: "Editor", joinedAt: "Feb 2024" },
  { id: "u_003", name: "Sam Chen", email: "sam@example.com", avatar: "https://picsum.photos/id/93/200/200", role: "Viewer", joinedAt: "Mar 2024" },
  { id: "u_004", name: "Morgan Kim", email: "morgan@example.com", avatar: "https://picsum.photos/id/94/200/200", role: "Editor", joinedAt: "Apr 2024" },
];

export const featuredItems: ListItem[] = [
  { id: "i_001", title: "Mountain Sunrise", subtitle: "Photography · 4.8 rating", imageUrl: "https://picsum.photos/id/20/600/400", badge: "Featured", rating: 4.8, price: "$12.99" },
  { id: "i_002", title: "Ocean Calm", subtitle: "Landscape · 4.6 rating", imageUrl: "https://picsum.photos/id/30/600/400", badge: "New", rating: 4.6, price: "$9.99" },
  { id: "i_003", title: "City Lights", subtitle: "Urban · 4.9 rating", imageUrl: "https://picsum.photos/id/40/600/400", rating: 4.9, price: "$14.99" },
  { id: "i_004", title: "Forest Path", subtitle: "Nature · 4.7 rating", imageUrl: "https://picsum.photos/id/50/600/400", badge: "Popular", rating: 4.7, price: "$11.99" },
  { id: "i_005", title: "Desert Dunes", subtitle: "Travel · 4.5 rating", imageUrl: "https://picsum.photos/id/60/600/400", rating: 4.5, price: "$8.99" },
];

export const dashboardStats: Stat[] = [
  { label: "Total Revenue", value: "$24,830", change: "+12.5%", positive: true },
  { label: "Active Users", value: "1,284", change: "+8.2%", positive: true },
  { label: "Avg. Session", value: "4m 32s", change: "-1.3%", positive: false },
  { label: "Conversion", value: "3.6%", change: "+0.8%", positive: true },
];

export const recentActivity = [
  { id: "a_001", action: "New user signed up", user: "Jordan Lee", time: "2 min ago", type: "user" },
  { id: "a_002", action: "Order #4521 placed", user: "Sam Chen", time: "15 min ago", type: "order" },
  { id: "a_003", action: "Payment received", user: "Morgan Kim", time: "1h ago", type: "payment" },
  { id: "a_004", action: "Review submitted", user: "Alex Rivera", time: "3h ago", type: "review" },
  { id: "a_005", action: "Report generated", user: "System", time: "6h ago", type: "system" },
];

export const notifications = [
  { id: "n_001", title: "Welcome to the app!", body: "Discover features and get started.", read: false, time: "Just now" },
  { id: "n_002", title: "Your order is confirmed", body: "Order #4521 has been placed successfully.", read: false, time: "15 min ago" },
  { id: "n_003", title: "New message from Jordan", body: "Hey, can we schedule a call tomorrow?", read: true, time: "1h ago" },
  { id: "n_004", title: "Monthly report ready", body: "Your April analytics report is available.", read: true, time: "Yesterday" },
];
