import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Provider = "fullstory" | "posthog" | "hotjar";

function generateCode(provider: Provider, siteId: string): string {
  if (provider === "fullstory") {
    return `// FullStory Integration
window['_fs_debug'] = false;
window['_fs_host'] = 'fullstory.com';
window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
window['_fs_org'] = '${siteId}';
window['_fs_namespace'] = 'FS';
(function(m,n,e,t,l,o,g,y){
  // ... FullStory snippet
  g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};
})(window,document,'FS','script');`;
  }
  if (provider === "posthog") {
    return `// PostHog Integration
import posthog from 'posthog-js';

posthog.init('${siteId}', {
  api_host: 'https://app.posthog.com',
  session_recording: {
    maskAllInputs: true,
    maskInputOptions: { password: true },
  },
});`;
  }
  // hotjar
  return `<!-- Hotjar Tracking Code -->
<script>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${siteId},hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`;
}

export async function GET() {
  return NextResponse.json({ description: "Session replay config generator for FullStory, PostHog, and Hotjar" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const provider = (body.provider as Provider | undefined) ?? "posthog";
    const siteId = (body.siteId as string | undefined) ?? "";

    if (!siteId) return NextResponse.json({ error: "Missing siteId" }, { status: 400 });

    const code = generateCode(provider, siteId);
    return NextResponse.json({ code, provider, siteId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
