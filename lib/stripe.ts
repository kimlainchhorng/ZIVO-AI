export interface CheckoutSessionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const res = await fetch("/api/stripe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json() as { url?: string; sessionId?: string; error?: string };

  if (!res.ok || data.error) {
    throw new Error(data.error ?? "Failed to create checkout session");
  }

  if (!data.url || !data.sessionId) {
    throw new Error("Stripe response missing url or sessionId");
  }
  return { url: data.url, sessionId: data.sessionId };
}

export async function redirectToCheckout(params: CheckoutSessionParams): Promise<void> {
  const { url } = await createCheckoutSession(params);
  if (url) {
    window.location.href = url;
  }
}
