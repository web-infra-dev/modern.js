export function isVersionAtLeast18(): boolean {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split('.').map(Number);
  return versionArr[0] >= 18;
}

export function isVersionAtLeast22(): boolean {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split('.').map(Number);
  return versionArr[0] >= 22;
}

export function isVersionAtLeast20(): boolean {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split('.').map(Number);
  return versionArr[0] >= 20;
}
