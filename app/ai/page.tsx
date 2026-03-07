import { Suspense } from "react";
import AIPageClient from "./AIPageClient";

export default function AIPage() {
  return (
    <Suspense fallback={null}>
      <AIPageClient />
    </Suspense>
  );
}
