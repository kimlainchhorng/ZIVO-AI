import type { PluginFile } from "@/lib/plugins";

export function generatePusherIntegration(config: { appId: string }): PluginFile[] {
  return [
    {
      path: "app/api/pusher/route.ts",
      content: `import { NextResponse } from 'next/server';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const { channel, event, data } = await req.json().catch(() => ({})) as { channel?: string; event?: string; data?: unknown };\n  if (!channel || !event) return NextResponse.json({ error: 'channel and event required' }, { status: 400 });\n  // Trigger via Pusher HTTP API\n  const pusherUrl = \`https://api-${config.appId}.pusher.com/apps/${config.appId}/events\`;\n  const body = JSON.stringify({ name: event, channels: [channel], data: JSON.stringify(data) });\n  const res = await fetch(pusherUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${process.env.PUSHER_SECRET}\` }, body });\n  return NextResponse.json({ success: res.ok });\n}`,
    },
    {
      path: "hooks/usePusher.ts",
      content: `'use client';\nimport { useEffect, useRef } from 'react';\nexport function usePusher(channel: string, event: string, handler: (data: unknown) => void) {\n  const handlerRef = useRef(handler);\n  handlerRef.current = handler;\n  useEffect(() => {\n    // Requires pusher-js: npm install pusher-js\n    // const Pusher = require('pusher-js');\n    // const client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });\n    // const ch = client.subscribe(channel);\n    // ch.bind(event, (data: unknown) => handlerRef.current(data));\n    // return () => { ch.unbind(event); client.disconnect(); };\n  }, [channel, event]);\n}`,
    },
    {
      path: "components/RealtimeIndicator.tsx",
      content: `'use client';\nimport { useState } from 'react';\nexport default function RealtimeIndicator({ channel }: { channel: string }) {\n  const [connected] = useState(false);\n  return (\n    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color: connected ? '#10b981' : '#94a3b8' }}>\n      <div style={{ width:8, height:8, borderRadius:'50%', background: connected ? '#10b981' : '#475569' }} />\n      {connected ? \`Connected to \${channel}\` : 'Disconnected'}\n    </div>\n  );\n}`,
    },
  ];
}
