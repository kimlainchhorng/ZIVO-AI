/**
 * Post-processing utilities for AI-generated HTML.
 * Ensures images load properly and common issues are fixed.
 */

/**
 * Replaces broken, empty, or missing image src attributes with working
 * placeholder images from picsum.photos.
 */
export function fixBrokenImages(html: string): string {
  let counter = 1;

  // Replace <img> tags with no src attribute
  let result = html.replace(
    /<img\b([^>]*?)>/gi,
    (match, attrs: string) => {
      const hasSrc = /\bsrc\s*=/i.test(attrs);
      if (!hasSrc) {
        const n = counter++;
        return `<img${attrs} src="https://picsum.photos/400/300?random=${n}">`;
      }
      return match;
    }
  );

  // Replace empty src values: src="" or src=''
  result = result.replace(
    /<img\b([^>]*?)\bsrc\s*=\s*(?:""|'')([^>]*?)>/gi,
    (_, before: string, after: string) => {
      const n = counter++;
      return `<img${before} src="https://picsum.photos/400/300?random=${n}"${after}>`;
    }
  );

  // Replace obviously broken/placeholder src values
  result = result.replace(
    /<img\b([^>]*?)\bsrc\s*=\s*["']((?:\/placeholder[^"']*|#[^"']*|about:blank|placeholder(?:\.[a-z]+)?))["']([^>]*?)>/gi,
    (_, before: string, _src: string, after: string) => {
      const n = counter++;
      return `<img${before} src="https://picsum.photos/400/300?random=${n}"${after}>`;
    }
  );

  return result;
}

/**
 * Injects a Content-Security-Policy meta tag that allows picsum.photos images,
 * if one isn't already present.
 */
export function ensureImagePolicy(html: string): string {
  if (/<meta[^>]*content-security-policy/i.test(html)) return html;
  const metaTag =
    '<meta http-equiv="Content-Security-Policy" content="img-src * data: blob:;">';
  return html.replace(/<head>/i, `<head>\n  ${metaTag}`);
}
