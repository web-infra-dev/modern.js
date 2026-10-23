/**
 * MCP Apps can run in sandboxed iframes without allow-same-origin, where even
 * reading document.cookie throws SecurityError. Treat inaccessible cookies as
 * empty so browser runtime initialization can complete, without hiding other errors.
 */
export function readDocumentCookie(
  source: Pick<Document, 'cookie'> = document,
) {
  try {
    return source.cookie || '';
  } catch (error) {
    if ((error as { name?: string })?.name === 'SecurityError') return '';
    throw error;
  }
}
