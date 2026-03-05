import type { PluginFile } from "@/lib/plugins";

export function generateUploadThingIntegration(): PluginFile[] {
  return [
    {
      path: "lib/uploadthing.ts",
      content: `// UploadThing client configuration\n// Install: npm install uploadthing @uploadthing/react\nexport const uploadthingEndpoint = '/api/uploadthing';`,
    },
    {
      path: "app/api/uploadthing/route.ts",
      content: `import { NextResponse } from 'next/server';\nexport const runtime = 'nodejs';\n// Replace with real UploadThing router after npm install uploadthing\nexport async function POST(req: Request) {\n  const formData = await req.formData();\n  const file = formData.get('file') as Blob | null;\n  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });\n  // TODO: Integrate with UploadThing SDK\n  return NextResponse.json({ url: '/uploads/placeholder' });\n}`,
    },
    {
      path: "components/FileUploader.tsx",
      content: `'use client';\nimport { useState } from 'react';\nexport default function FileUploader({ onUpload }: { onUpload: (url: string) => void }) {\n  const [uploading, setUploading] = useState(false);\n  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {\n    const file = e.target.files?.[0];\n    if (!file) return;\n    setUploading(true);\n    const fd = new FormData();\n    fd.append('file', file);\n    const res = await fetch('/api/uploadthing', { method: 'POST', body: fd });\n    const data = await res.json() as { url?: string };\n    if (data.url) onUpload(data.url);\n    setUploading(false);\n  };\n  return (<label style={{ display:'inline-block', padding:'8px 16px', background:'#6366f1', color:'#fff', borderRadius:6, cursor:'pointer' }}>{uploading ? 'Uploading\u2026' : 'Upload File'}<input type="file" onChange={handleChange} style={{ display:'none' }} /></label>);\n}`,
    },
  ];
}
