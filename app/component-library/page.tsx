import { Suspense } from "react";
import ComponentLibraryPageClient from "./ComponentLibraryPageClient";

export default function ComponentLibraryPage() {
  return (
    <Suspense fallback={null}>
      <ComponentLibraryPageClient />
    </Suspense>
  );
}
