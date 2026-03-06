import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HelpProvider = "intercom" | "crisp" | "custom";

function generateHelpCode(provider: HelpProvider, config: Record<string, unknown>): string {
  if (provider === "intercom") {
    return `// Intercom Integration
window.intercomSettings = {
  app_id: "${config.appId ?? "YOUR_APP_ID"}",
};
(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${config.appId ?? "YOUR_APP_ID"}';var x=d.getElementsByTagName('script')[0];x.parentNode?.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}}());`;
  }
  if (provider === "crisp") {
    return `// Crisp Integration
window.$crisp = [];
window.CRISP_WEBSITE_ID = "${config.websiteId ?? "YOUR_WEBSITE_ID"}";
(function() {
  var d = document;
  var s = d.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = true;
  d.getElementsByTagName("head")[0].appendChild(s);
})();`;
  }
  // custom
  return `<!-- Custom Docs Integration -->
<script>
  // Redirect users to your documentation
  var DOCS_URL = "${config.docsUrl ?? "https://docs.yourapp.com"}";
  
  document.querySelector('[data-help-trigger]')?.addEventListener('click', function() {
    window.open(DOCS_URL, '_blank', 'width=800,height=600');
  });
</script>`;
}

export async function GET() {
  return NextResponse.json({ description: "Help center integration code generator for Intercom, Crisp, and custom docs" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const provider = (body.provider as HelpProvider | undefined) ?? "intercom";
    const config = (body.config as Record<string, unknown> | undefined) ?? {};

    const code = generateHelpCode(provider, config);
    return NextResponse.json({ code, provider });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
