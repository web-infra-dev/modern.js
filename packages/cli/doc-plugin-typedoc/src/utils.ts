export function transformModuleName(name: string) {
  return name.replace(/\//g, '_').replace(/-/g, '_');
}
