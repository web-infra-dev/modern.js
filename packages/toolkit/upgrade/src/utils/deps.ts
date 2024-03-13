const deprecated: string[] = [
  '@modern-js/plugin-storybook',
  '@modern-js/builder-rspack-provider',
];

// This deps should not update
const excludes: string[] = [
  'electron',
  '@modern-js-reduck',
  'codesmith',
  'easy-form',
  ...deprecated,
];

/**
 * Gather modern deps from package.json
 * - @modern-js/**
 * - not in excludes
 * @param pkgJson
 */
export const getModernDeps = (pkgJson: Record<string, any>) => {
  const { devDependencies = {}, dependencies = {} } = pkgJson;

  const deps = {
    ...devDependencies,
    ...dependencies,
  };

  // get modern deps which should be upgraded
  // return a object
  const modernDeps = Object.keys(deps)
    .filter(
      dep =>
        (dep.startsWith('@modern-js/') || dep.startsWith('@modern-js-app/')) &&
        excludes.every(i => !dep.includes(i)),
    )
    .reduce<Record<string, any>>((acc, name) => {
      acc[name] = deps[name];
      return acc;
    }, {});

  return modernDeps;
};

export const validateDepsVerison = (
  deps: Record<string, string>,
  version: string,
) => {
  const list = Object.values(deps);
  if (list.length === 0) {
    return false;
  }
  return list.every(dep => dep === version);
};

/**
 * Update modern deps to version
 * @param pkgJson package.json
 * @param version modern version
 * @returns pkgJson
 */
export const updateModernVersion = (
  pkgJson: Record<string, any>,
  version: string,
) => {
  const modernDeps = getModernDeps(pkgJson);

  Object.keys(modernDeps).forEach(dep => {
    if (pkgJson?.devDependencies[dep]) {
      pkgJson.devDependencies[dep] = version;
    } else if (pkgJson?.dependencies[dep]) {
      pkgJson.dependencies[dep] = version;
    }
  });
  return pkgJson;
};
