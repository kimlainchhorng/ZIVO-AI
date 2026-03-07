// lib/build/strip-axios.ts
// Replaces axios usage with native fetch in generated files

export function stripAxios(content: string): string {
  // Remove axios import lines
  let result = content
    .replace(/^import\s+axios(?:,\s*\{[^}]*\})?\s+from\s+['"]axios['"];?\s*$/gm, "")
    .replace(/^const\s+axios\s*=\s*require\(['"]axios['"]\);?\s*$/gm, "");

  // Replace simple axios.get calls
  result = result.replace(
    /await\s+axios\.get\s*\(\s*([^,)]+)\s*\)/g,
    "await fetch($1).then(r => r.json())"
  );

  // Replace simple axios.post calls
  result = result.replace(
    /await\s+axios\.post\s*\(\s*([^,)]+),\s*([^)]+)\s*\)/g,
    "await fetch($1, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify($2) }).then(r => r.json())"
  );

  return result;
}
