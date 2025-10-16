/**
 * Utility to handle HTML content from JSON files
 * 
 * Since importing HTML strings from JSON causes escaping issues in Next.js static export,
 * we use a workaround: decode HTML entities at runtime to restore proper HTML.
 */

export function unescapeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (will be fixed client-side)
    return html;
  }
  
  // Client-side: Use browser's built-in HTML parser to properly decode
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

