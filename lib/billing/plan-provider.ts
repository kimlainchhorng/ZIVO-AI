// lib/billing/plan-provider.ts — Plan-tier abstraction
// TODO: Wire Stripe here when billing is implemented.
//       Replace getPlanTierForUser() with a real Stripe subscription lookup,
//       e.g. using the `stripe.subscriptions.list` API keyed on userId.

export type PlanTier = "free" | "pro" | "team";

/**
 * Returns the billing plan tier for the given user.
 *
 * Currently stubbed: all users are on the `free` tier.
 * Once Stripe is integrated, replace this implementation with a real
 * subscription check using `STRIPE_SECRET_KEY`.
 */
export async function getPlanTierForUser(_userId: string): Promise<PlanTier> {
  // TODO: look up Stripe subscription for userId and return 'pro' or 'team' accordingly.
  return "free";
}

/**
 * Returns the default project visibility for the given plan tier.
 * Free users default to 'public' until private projects are gated behind a paid plan.
 */
export function defaultVisibilityForPlan(_tier: PlanTier): "public" | "private" {
  // TODO: return 'private' for 'pro' and 'team' tiers once Stripe is wired.
  return "public";
}
