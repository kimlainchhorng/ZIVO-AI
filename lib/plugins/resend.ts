import type { PluginFile } from "@/lib/plugins";

export function generateResendIntegration(config: {
  fromEmail: string;
  fromName: string;
}): PluginFile[] {
  return [
    {
      path: "lib/email.ts",
      content: `// Resend email client\nexport async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {\n  const res = await fetch('https://api.resend.com/emails', {\n    method: 'POST',\n    headers: { 'Authorization': \`Bearer \${process.env.RESEND_API_KEY}\`, 'Content-Type': 'application/json' },\n    body: JSON.stringify({ from: '${config.fromName} <${config.fromEmail}>', to, subject, html }),\n  });\n  if (!res.ok) throw new Error('Failed to send email via Resend');\n  return res.json();\n}`,
    },
    {
      path: "app/api/send-email/route.ts",
      content: `import { NextResponse } from 'next/server';\nimport { sendEmail } from '@/lib/email';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const { to, subject, html } = await req.json().catch(() => ({})) as { to?: string; subject?: string; html?: string };\n  if (!to || !subject || !html) return NextResponse.json({ error: 'to, subject, html required' }, { status: 400 });\n  const result = await sendEmail({ to, subject, html });\n  return NextResponse.json({ success: true, id: (result as { id?: string }).id });\n}`,
    },
    {
      path: "components/ContactForm.tsx",
      content: `'use client';\nimport { useState } from 'react';\nexport default function ContactForm() {\n  const [email, setEmail] = useState('');\n  const [message, setMessage] = useState('');\n  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');\n  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setStatus('sending');\n    try {\n      await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: email, subject: 'Contact Form', html: \`<p>\${message}</p>\` }) });\n      setStatus('sent');\n    } catch { setStatus('error'); }\n  };\n  return (<form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email" type="email" required style={{ padding:8, borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9' }} /><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" required rows={4} style={{ padding:8, borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9' }} /><button type="submit" disabled={status==='sending'} style={{ padding:'8px 16px', background:'#6366f1', color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>{status==='sending'?'Sending...':status==='sent'?'Sent!':'Send'}</button></form>);\n}`,
    },
  ];
}
