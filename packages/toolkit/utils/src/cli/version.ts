export function isVersionAtLeast1819(): boolean {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split('.').map(Number);
  return versionArr[0] > 18 || (versionArr[0] === 18 && versionArr[1] >= 19);
}
