import path from 'path';
import { transform } from '@swc/core';
import type { LoaderContext } from 'webpack';
import { setRscBuildInfo } from './common';

export type RscServerLoaderOptions = {
  appDir: string;
  runtimePath?: string;
  detectOnly?: boolean;
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

export default async function rscServerLoader(
  this: LoaderContext<RscServerLoaderOptions>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();
  const { appDir, runtimePath = '@modern-js/runtime/rsc/server', detectOnly = false } =
    this.getOptions();

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
        console.log('[rsc-server-loader] detectOnly mode, returning original source');
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
