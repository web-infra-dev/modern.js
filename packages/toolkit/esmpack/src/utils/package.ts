import validatePackageName from 'validate-npm-package-name';
/**
 * Sanitizes npm packages that end in .js (e.g `tippy.js` -> `tippyjs`).
 * This is necessary because Snowpack can’t create both a file and directory
 * that end in .js.
 */
export function sanitizePackageName(filepath: string): string {
  const dirs = filepath.split('/');
  const file = dirs.pop() as string;
  return [...dirs.map(path => path.replace(/\.js$/i, 'js')), file].join('/');
}

/**
 * Formats the snowpack dependency name from a "webDependencies" input value:
 * 2. Remove any ".js"/".mjs" extension (will be added automatically by Rollup)
 */
export function getWebDependencyName(dep: string): string {
  return validatePackageName(dep).validForNewPackages
    ? dep.replace(/\.js$/i, 'js') // if this is a top-level package ending in .js, replace with js (e.g. tippy.js -> tippyjs)
    : dep.replace(/\.m?js$/i, ''); // otherwise simply strip the extension (Rollup will resolve it)
}

/**
 * get entry filename by specifier
 * @param name specifier pass to compilation
 * @returns the dest filename for the given specifier
 */
export function getEntryFilename(name: string): string {
  const targetName = getWebDependencyName(name);
  const proxiedName = sanitizePackageName(targetName);
  return `${proxiedName}.js`;
}

/**
 * 确保 `@namespace/package/dir/file` 的引用变成 `@namespace/package`
 *
 * @param {string} name
 * @returns
 */
export function normalizePackageName(name: string) {
  const ns = name.split('/');
  if (ns[0].startsWith('@')) {
    return ns[0] + '/' + ns[1];
  }
  return ns[0];
}
