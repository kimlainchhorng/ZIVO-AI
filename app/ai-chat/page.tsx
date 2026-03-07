import { Suspense } from "react";
import AIChatPageClient from "./AIChatPageClient";

export default function AIChatPage() {
  return (
    <Suspense fallback={null}>
      <AIChatPageClient />
    </Suspense>
  );
}
