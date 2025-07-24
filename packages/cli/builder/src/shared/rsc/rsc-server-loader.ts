import path from 'path';
import type { Rspack } from '@rsbuild/core';
import { transform } from '@swc/core';
import { setRscBuildInfo } from './common';

export type RscServerLoaderOptions = {
  appDir: string;
  runtimePath?: string;
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
  this: Rspack.LoaderContext<RscServerLoaderOptions>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();
  const { appDir, runtimePath = '@modern-js/runtime/rsc/server' } =
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
    const { exportNames } = metadata;
    if (exportNames.length > 0) {
      setRscBuildInfo(this._module!, {
        type: 'client',
        resourcePath: this.resourcePath,
        clientReferences: exportNames,
      });
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
