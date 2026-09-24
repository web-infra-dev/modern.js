/** Sandboxed iframes without allow-same-origin cannot access document.cookie. */
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
