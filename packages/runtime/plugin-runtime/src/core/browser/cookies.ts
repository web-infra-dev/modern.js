import { parseCookie } from 'cookie';

// Preserve the browser request contract while allowing the ESM parser to be
// tree-shaken independently of Set-Cookie serialization.
function decodeCookie(value: string) {
  if (value.charCodeAt(0) === 34 && value.charCodeAt(value.length - 1) === 34)
    value = value.slice(1, -1);
  if (value.indexOf('%') === -1) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
const cookieOptions = { decode: decodeCookie };
export function parseBrowserCookies(
  cookie: string,
): Record<string, string | undefined> {
  // Keep a plain object and the legacy handling of the __proto__ string key.
  return Object.assign({}, parseCookie(cookie, cookieOptions));
}
