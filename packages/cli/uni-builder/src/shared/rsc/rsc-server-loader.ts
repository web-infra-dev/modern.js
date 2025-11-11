import path from 'path';
import { transform } from '@swc/core';
import type { LoaderContext } from 'webpack';
import { setRscBuildInfo } from './common';

export type RscServerLoaderOptions = {
  appDir: string;
  runtimePath?: string;
  detectOnly?: boolean;
  isServer?: boolean;
};

interface ExportName {
  id: string;
  exportName: string;
}

interface SWCMetadata {
  directive: string;
  exportNames: ExportName[];
}

function extractMetadata(code: string): SWCMetadata | null {
  const metadataRegex = /\/\* @modern-js-rsc-metadata\n([\s\S]*?)\*\//;

  const match = code.match(metadataRegex);
  if (!match) return null;

  try {
    const metadata = JSON.parse(match[1]) as SWCMetadata;
    return metadata;
  } catch (e) {
    console.error('Failed to parse metadata:', e);
    return null;
  }
}

/**
 * Extract export names from source code without running transform.
 * Used when skipping transform in SSR context to still provide metadata.
 */
function extractExportNames(source: string): string[] {
  const exports: string[] = [];

  // Match: export async function name / export function name
  const funcMatches = source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
  for (const match of funcMatches) {
    if (match[1] && match[1] !== 'default') {
      exports.push(match[1]);
    }
  }

  // Match: export const/let/var name
  const varMatches = source.matchAll(/export\s+(?:const|let|var)\s+(\w+)/g);
  for (const match of varMatches) {
    if (match[1]) {
      exports.push(match[1]);
    }
  }

  // Match: export { name, name2 as alias }
  const namedExportMatches = source.matchAll(/export\s+\{([^}]+)\}/g);
  for (const match of namedExportMatches) {
    const names = match[1].split(',').map(s => s.trim());
    for (const name of names) {
      // Handle "name as alias" - we want the original name
      const actualName = name.split(/\s+as\s+/)[0].trim();
      if (actualName && actualName !== 'default') {
        exports.push(actualName);
      }
    }
  }

  // Match: export default
  if (/export\s+default/.test(source)) {
    exports.push('default');
  }

  return [...new Set(exports)]; // Deduplicate
}

export default async function rscServerLoader(
  this: LoaderContext<RscServerLoaderOptions>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();
  const {
    appDir,
    runtimePath = '@modern-js/runtime/rsc/server',
    detectOnly = false,
    isServer = false,
  } = this.getOptions();

  // Detect SSR/server context to prevent client-error injection
  const isSSRContext =
    isServer ||
    this._module?.layer === 'rsc-server' ||
    (this._compilation?.options.target &&
      String(this._compilation.options.target).includes('node')) ||
    (this._compilation?.compiler?.name &&
      /server|ssr|node/i.test(this._compilation.compiler.name));

  // CRITICAL: Pre-check for 'use server' in SSR context to skip transform entirely.
  // The flight-server-transform-plugin injects a 610 error module for 'use server'
  // that throws "This module cannot be imported from a Client Component module".
  // In SSR bundles, we need the actual server action code to execute, not the error.
  if (isSSRContext) {
    const hasUseServer = /^\s*['"]use server['"]/.test(source);
    if (hasUseServer) {
      // Extract export names manually since we're skipping transform
      const exportNames = extractExportNames(source);

      // Publish server action metadata for manifest building
      if (exportNames.length > 0) {
        setRscBuildInfo(this._module!, {
          type: 'server',
          resourcePath: this.resourcePath,
          exportNames,
        });
      }

      if (process.env.DEBUG_RSC_LOADER) {
        // eslint-disable-next-line no-console
        console.log(
          `[rsc-server-loader] SSR context with use server detected, skipping transform but extracted ${exportNames.length} export(s): ${this.resourcePath}`,
        );
      }

      // Return original source without running transform - no 610 error injection
      return callback(null, source);
    }
  }

  const result = await transform(source, {
    filename: this.resourcePath,
    jsc: {
      target: 'es2020',
      experimental: {
        cacheRoot: path.resolve(appDir, 'node_modules/.swc'),
        plugins: [
          [
            require.resolve('@modern-js/flight-server-transform-plugin'),
            {
              appDir: appDir,
              runtimePath: runtimePath,
              isServer: isSSRContext,
            },
          ],
        ],
      },
    },
    isModule: true,
  });

  const { code, map } = result;

  const metadata = extractMetadata(code);

  if (metadata?.directive && metadata.directive === 'client') {
    if (process.env.DEBUG_RSC_LOADER) {
      // eslint-disable-next-line no-console
      console.log(
        '[rsc-server-loader] detected client module:',
        this.resourcePath,
      );
    }
    const { exportNames } = metadata;
    if (exportNames.length > 0) {
      setRscBuildInfo(this._module!, {
        type: 'client',
        resourcePath: this.resourcePath,
        clientReferences: exportNames,
      });

      // CRITICAL: Also publish to sharedData immediately for multi-compiler builds.
      // This ensures the client compiler can see client references early.
      try {
        const { sharedData } = require('./common');
        const key = `${this.resourcePath}:client-refs`;
        sharedData.set(key, {
          type: 'client',
          resourcePath: this.resourcePath,
          clientReferences: exportNames,
        });
        if (process.env.DEBUG_RSC_LOADER) {
          // eslint-disable-next-line no-console
          console.log('[rsc-server-loader] published to sharedData:', key);
        }
      } catch (err) {
        // Silently fail if sharedData unavailable
      }
    }

    // If detectOnly mode, return original source without SWC transform
    if (detectOnly) {
      if (process.env.DEBUG_RSC_LOADER) {
        // eslint-disable-next-line no-console
        console.log(
          '[rsc-server-loader] detectOnly mode, returning original source',
        );
      }
      return callback(null, source);
    }
  } else if (metadata) {
    const { exportNames } = metadata;
    if (exportNames.length > 0) {
      setRscBuildInfo(this._module!, {
        type: 'server',
        resourcePath: this.resourcePath,
        exportNames: exportNames.map(item => item.exportName),
      });
    }
  }

  return callback(null, code, map);
}
