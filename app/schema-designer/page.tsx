import { Suspense } from "react";
import SchemaDesignerPageClient from "./SchemaDesignerPageClient";

export default function SchemaDesignerPage() {
  return (
    <Suspense fallback={null}>
      <SchemaDesignerPageClient />
    </Suspense>
  );
}
