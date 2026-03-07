import { Suspense } from "react";
import AiLoginPageClient from "./AiLoginPageClient";

export default function AiLoginPage() {
  return (
    <Suspense fallback={null}>
      <AiLoginPageClient />
    </Suspense>
  );
}
