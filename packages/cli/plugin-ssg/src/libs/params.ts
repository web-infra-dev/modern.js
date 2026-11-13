import path from 'path';
import { compatibleRequire, SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';
import type { AgreedRoute } from '../types';

function encodeSegment(value: string): string {
  // URL parsing normalizes dot segments even when they are percent encoded.
  if (!value || value === '.' || value === '..') {
    throw new Error('parameters must not contain empty or dot path segments');
  }
  // React Router decodes this sequence again when extracting matched params.
  if (/%2f/i.test(value)) {
    throw new Error('parameters must use raw slashes instead of literal "%2F"');
  }
  // Keep generated directory names portable, including a literal "*" on Windows.
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function generatePaths(pattern: string, result: unknown): string[] {
  if (!Array.isArray(result)) {
    throw new Error('expected an array of parameter objects');
  }

  const paths = Array.from(result, (params, index) => {
    if (
      !params ||
      typeof params !== 'object' ||
      (Object.getPrototypeOf(params) !== Object.prototype &&
        Object.getPrototypeOf(params) !== null)
    ) {
      throw new Error(`expected a parameter object at index ${index}`);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && typeof value !== 'string') {
        throw new Error(
          `parameter "${key}" at index ${index} must be a string`,
        );
      }
    }

    const segments = pattern.split('/').filter(Boolean);
    const resolved = segments.map((segment, segmentIndex) => {
      if (segment === '*' && segmentIndex === segments.length - 1) {
        const value = Object.hasOwn(params, '*') ? params['*'] : undefined;
        // A splat can match the parent path itself.
        return value === undefined || value === ''
          ? ''
          : value.split('/').map(encodeSegment).join('/');
      }

      const match = segment.match(/^:([\w-]+)(\??)$/);
      if (match) {
        const [, name, optional] = match;
        const value = Object.hasOwn(params, name) ? params[name] : undefined;
        if (value === undefined && optional) {
          return '';
        }
        if (value === undefined) {
          throw new Error(`missing parameter "${name}" at index ${index}`);
        }
        return encodeSegment(value);
      }
      return segment.replace(/\?$/, '');
    });

    return `/${resolved.filter(Boolean).join('/')}`;
  });

  return [...new Set(paths)];
}

export function createParamsResolver(buildDir: string) {
  const bundles = new Map<string, Promise<Record<string, unknown>>>();
  const generated = new Map<string, Promise<string[]>>();

  return (entryName: string, route: AgreedRoute): Promise<string[]> => {
    const key = JSON.stringify([entryName, route.id]);
    let paths = generated.get(key);
    if (!paths) {
      paths = (async () => {
        try {
          let bundle = bundles.get(entryName);
          if (!bundle) {
            bundle = (async () => {
              const module = await compatibleRequire(
                path.join(
                  buildDir,
                  SERVER_BUNDLE_DIRECTORY,
                  `${entryName}-server-loaders.js`,
                ),
                false,
              );
              const loaded = module.loadModules
                ? await module.loadModules()
                : module;
              return loaded.ssgParams;
            })();
            bundles.set(entryName, bundle);
          }
          const generators = await bundle;
          const generator = generators?.[route.id!];
          if (typeof generator !== 'function') {
            throw new Error('expected ssgParams to be a function');
          }
          return generatePaths(route.path || '/', await generator());
        } catch (cause) {
          const message =
            cause instanceof Error ? cause.message : String(cause);
          throw new Error(
            `ssgParams failed for route "${route.path || '/'}" (${route.ssgParams}): ${message}`,
            { cause },
          );
        }
      })();
      generated.set(key, paths);
    }
    return paths;
  };
}
