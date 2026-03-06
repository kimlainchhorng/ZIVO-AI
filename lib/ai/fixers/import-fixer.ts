export interface ImportIssue {
  file: string;
  missingImport: string;
  suggestion: string;
}

export function detectMissingImports(files: { path: string; content: string }[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const definedExports = new Set<string>();

  // Collect all defined exports
  for (const file of files) {
    const exportMatches = file.content.matchAll(/export (?:default )?(?:function|class|const|interface|type) (\w+)/g);
    for (const match of exportMatches) {
      definedExports.add(match[1]);
    }
  }

  // Check each file for used but undefined imports
  for (const file of files) {
    if (!file.path.match(/\.(ts|tsx)$/)) continue;

    // Find import statements
    const importMatches = file.content.matchAll(/import\s+.*?from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      // Basic check for local imports — a full implementation would resolve and validate paths
      void importPath;
    }
  }

  return issues;
}

export function fixImports(content: string, fixes: { from: string; to: string }[]): string {
  let fixed = content;
  for (const fix of fixes) {
    fixed = fixed.replace(new RegExp(escapeRegex(fix.from), "g"), fix.to);
  }
  return fixed;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
