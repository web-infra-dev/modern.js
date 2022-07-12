// [@\w] - Match a word-character or @ (valid package name)
// (?!.*(:\/\/)) - Ignore if previous match was a protocol (ex: http://)
export const BARE_SPECIFIER_REGEX = /^[@\w](?!.*(:\/\/))/;
