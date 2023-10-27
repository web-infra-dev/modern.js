export const MAJOR_VERSION_RE = /(\d+)\./;

export function getMajorVersion(v: string) {
  const major = v.match(MAJOR_VERSION_RE)![1];

  return parseInt(major, 10);
}
