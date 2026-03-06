export interface RouteIssue {
  route: string;
  issue: "missing-page" | "missing-layout" | "missing-api";
  filePath: string;
}

export function detectMissingRoutes(
  files: { path: string; content: string }[],
  expectedRoutes: string[]
): RouteIssue[] {
  const issues: RouteIssue[] = [];
  const generatedPaths = new Set(files.map(f => f.path));

  for (const route of expectedRoutes) {
    // Convert route to expected file path
    let filePath: string;
    if (route.startsWith("/api/")) {
      filePath = `app${route}/route.ts`;
    } else {
      filePath = `app${route === "/" ? "" : route}/page.tsx`;
    }

    if (!generatedPaths.has(filePath)) {
      issues.push({
        route,
        issue: route.startsWith("/api/") ? "missing-api" : "missing-page",
        filePath,
      });
    }
  }

  return issues;
}
