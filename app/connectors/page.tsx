import { Suspense } from "react";
import ConnectorsPageClient from "./ConnectorsPageClient";

export default function ConnectorsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectorsPageClient />
    </Suspense>
  );
}
