import { Suspense } from "react";
import MarketplacePageClient from "./MarketplacePageClient";

export default function MarketplacePage() {
  return (
    <Suspense fallback={null}>
      <MarketplacePageClient />
    </Suspense>
  );
}
