import { Suspense } from "react";
import EnterprisePageClient from "./EnterprisePageClient";

export default function EnterprisePage() {
  return (
    <Suspense fallback={null}>
      <EnterprisePageClient />
    </Suspense>
  );
}
