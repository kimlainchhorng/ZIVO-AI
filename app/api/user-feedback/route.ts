import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WIDGET_CODE = `<!-- ZIVO Feedback Widget -->
<script>
  (function() {
    var widget = document.createElement('div');
    widget.id = 'zivo-feedback';
    widget.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
    widget.innerHTML = '<button onclick="this.nextSibling.style.display=\\'block\\'">Feedback</button>'
      + '<form style="display:none;background:#fff;padding:16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);">'
      + '<textarea placeholder="Your feedback..." rows="3" style="width:200px;"></textarea>'
      + '<div>Rating: <input type="number" min="1" max="5" value="5" style="width:40px;"></div>'
      + '<button type="submit">Submit</button>'
      + '</form>';
    document.body.appendChild(widget);
  })();
</script>`;

export async function GET() {
  return NextResponse.json({ description: "User feedback widget API" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = body.action as string | undefined;

    if (action === "get-widget-code") {
      return NextResponse.json({ code: WIDGET_CODE });
    }

    if (action === "submit") {
      const feedback = body.feedback as Record<string, unknown> | undefined;
      // In production this would persist to a database
      return NextResponse.json({ success: true, received: feedback ?? {} });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
