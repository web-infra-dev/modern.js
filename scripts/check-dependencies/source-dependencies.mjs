import { realpath } from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  contains,
  exists,
  ownerOf,
  readWorkspace,
  slash,
  sourceFiles,
} from './workspace.mjs';

const declarationFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

export function packageName(specifier) {
  if (
    !specifier ||
    /^[.#/\\]/.test(specifier) ||
    specifier.includes(':') ||
    isBuiltin(specifier)
  )
    return;
  const clean = specifier.split(/[?#]/)[0];
  if (clean.startsWith('@')) {
    const [scope, name] = clean.split('/');
    if (name && /^@[\w.-]+$/.test(scope) && /^[\w.-]+$/.test(name))
      return `${scope}/${name}`;
  } else {
    const name = clean.split('/')[0];
    if (/^[\w-][\w.-]*$/.test(name)) return name;
  }
}

function typesPackage(name) {
  return name.startsWith('@')
    ? `@types/${name.slice(1).replace('/', '__')}`
    : `@types/${name}`;
}

function declared(manifest, name) {
  return (
    manifest.name === name ||
    declarationFields.some(field => Object.hasOwn(manifest[field] ?? {}, name))
  );
}

function matchesAlias(specifier, pattern) {
  const star = pattern.indexOf('*');
  return star === -1
    ? specifier === pattern
    : specifier.startsWith(pattern.slice(0, star)) &&
        specifier.endsWith(pattern.slice(star + 1));
}

export function inspectDependency(
  pkg,
  dependency,
  packages,
  compilerOptions = {},
) {
  const specifier = dependency.module;
  if (isBuiltin(specifier) || dependency.coreModule) return;
  const alias = Object.keys(compilerOptions.paths ?? {}).some(pattern =>
    matchesAlias(specifier, pattern),
  );
  const resolved =
    !dependency.couldNotResolve && dependency.resolved
      ? resolve(packages[0].directory, dependency.resolved)
      : undefined;
  const installed = resolved && slash(resolved).includes('/node_modules/');
  const target =
    resolved && !installed ? ownerOf(resolved, packages) : undefined;
  let name;
  if (target && target.directory !== pkg.directory) {
    name = target.manifest.name;
  } else if (
    target ||
    (resolved && contains(pkg.directory, resolved) && !installed)
  ) {
    return;
  } else if (
    dependency.couldNotResolve &&
    (alias || specifier.startsWith('#') || !packageName(specifier))
  ) {
    return {
      severity: 'warning',
      rule: 'unresolved-reference',
      specifier,
      message: `Cannot resolve ${JSON.stringify(specifier)}. Check the file path or alias configuration.`,
    };
  } else {
    name = packageName(specifier);
  }
  if (!name) return;
  const typeProvider = typesPackage(name);
  const typeReference =
    dependency.typeOnly ||
    dependency.preCompilationOnly ||
    slash(dependency.resolved ?? '').includes('/node_modules/@types/');
  if (
    declared(pkg.manifest, name) ||
    (typeReference && declared(pkg.manifest, typeProvider))
  )
    return;
  return {
    severity: 'error',
    rule: 'undeclared-dependency',
    specifier,
    dependency: name,
    message: `${JSON.stringify(name)} is referenced by ${JSON.stringify(specifier)} but is not declared in ${pkg.path}/package.json${dependency.couldNotResolve ? ' (also unresolved)' : ''}.`,
  };
}

export async function checkSourceDependencies(root, { selectedPaths } = {}) {
  const started = performance.now();
  root = await realpath(root);
  const packages = await readWorkspace(root);
  const selected = selectedPaths
    ? packages.filter(pkg => selectedPaths.includes(pkg.path))
    : packages;
  const inputs = [];
  for (const pkg of selected) {
    const files = await sourceFiles(pkg);
    if (files.length) inputs.push({ pkg, files });
  }
  if (!inputs.length)
    return {
      packages: 0,
      files: 0,
      diagnostics: [],
      elapsedMs: performance.now() - started,
    };
  const { cruise } = await import('dependency-cruiser');
  const { default: typescript } = await import('typescript');
  const { default: extractTSConfig } =
    await import('dependency-cruiser/config-utl/extract-ts-config');
  const diagnostics = [];
  let fileCount = 0;
  const previousDirectory = process.cwd();
  try {
    // The library's file collection uses cwd in addition to baseDir. Keep this
    // scoped to a single sequential run and restore it even after parser errors.
    process.chdir(root);
    for (const { pkg, files } of inputs) {
      const tsConfigPath = resolve(pkg.directory, 'tsconfig.json');
      const tsConfig = (await exists(tsConfigPath))
        ? extractTSConfig(tsConfigPath)
        : undefined;
      const paths = files.sort().map(file => slash(`${pkg.path}/${file}`));
      const scope = `${pkg.path}/src`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const result = await cruise(
        paths,
        {
          baseDir: root,
          combinedDependencies: false,
          preserveSymlinks: true,
          exoticRequireStrings: ['require.resolve'],
          tsPreCompilationDeps: 'specify',
          ...(tsConfig ? { tsConfig: { fileName: tsConfigPath } } : {}),
          enhancedResolveOptions: {
            exportsFields: ['exports'],
            conditionNames: ['types', 'node', 'import', 'require', 'default'],
            mainFields: ['types', 'typings', 'module', 'main'],
          },
          doNotFollow: { path: `^(?!(?:\\./)?${scope}(?:/|$))` },
          exclude: {
            path: [
              `^${scope}/(?:fixtures|__fixtures__|templates?|__tests__|tests|compiled|dist)(?:/|$)`,
              `^${scope}/.*/(?:fixtures|__fixtures__|templates?|__tests__|tests|compiled|dist)(?:/|$)`,
              `^${scope}/.*\\.(?:test|spec)\\.[cm]?[jt]sx?$`,
            ],
          },
        },
        {},
        tsConfig ? { tsConfig } : {},
      );
      const report =
        typeof result.output === 'string'
          ? JSON.parse(result.output)
          : result.output;
      const modules = report.modules.filter(module =>
        paths.includes(slash(module.source)),
      );
      if (modules.length !== paths.length)
        throw new Error(
          `Expected ${paths.length} source modules in ${pkg.path}, scanned ${modules.length}`,
        );
      fileCount += modules.length;
      for (const module of modules) {
        for (const dependency of module.dependencies) {
          let reference = dependency;
          if (
            Object.keys(tsConfig?.options.paths ?? {}).some(pattern =>
              matchesAlias(dependency.module, pattern),
            )
          ) {
            // Inherited workspace configs can retain logical node_modules paths.
            // Use TypeScript's flattened config and the canonical target for
            // alias ownership, rather than treating that path as an npm edge.
            const resolution = typescript.resolveModuleName(
              dependency.module,
              resolve(root, module.source),
              tsConfig.options,
              typescript.sys,
            ).resolvedModule;
            const resolved = resolution
              ? await realpath(resolution.resolvedFileName)
              : undefined;
            reference = {
              ...dependency,
              resolved,
              couldNotResolve: !resolution,
            };
          }
          const diagnostic = inspectDependency(
            pkg,
            reference,
            packages,
            tsConfig?.options,
          );
          if (diagnostic)
            diagnostics.push({
              packageName: pkg.manifest.name,
              path: slash(module.source),
              ...diagnostic,
            });
        }
      }
    }
  } finally {
    process.chdir(previousDirectory);
  }
  return {
    packages: inputs.length,
    files: fileCount,
    diagnostics,
    elapsedMs: performance.now() - started,
  };
}
