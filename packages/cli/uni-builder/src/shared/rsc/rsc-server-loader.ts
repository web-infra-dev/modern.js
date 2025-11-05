import path from 'path';
import { transform } from '@swc/core';
import type { LoaderContext } from 'webpack';
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
  this: LoaderContext<RscServerLoaderOptions>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();
  const { appDir, runtimePath = '@modern-js/runtime/rsc/server' } =
    this.getOptions();

  // Check for .client.* suffix (treat as client component)
  if (/\.client\.[jt]sx?$/.test(this.resourcePath)) {
    // Return stub module for client components in server builds
    const stubCode = `// Client component stub (detected by .client.* suffix)\nexport default function ClientComponentStub() { return null; }\nexport const __rsc_client__ = true;\n`;

    setRscBuildInfo(this._module!, {
      type: 'client',
      resourcePath: this.resourcePath,
      clientReferences: [{ id: this.resourcePath, exportName: 'default' }],
    });

    return callback(null, stubCode, undefined);
  }

  // Check for .server.* suffix (treat as server component - allow through)
  // No special handling needed - let it continue to SWC transformation
  if (/\.server\.[jt]sx?$/.test(this.resourcePath)) {
    // Server component marker - will be processed normally
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
            },
          ],
        ],
      },
    },
    isModule: true,
  });

  const { code, map } = result;

  const metadata = extractMetadata(code);
  const trimmedSource = source.replace(/^[\s\uFEFF\u200B]+/, '');
  const hasUseClientDirective = /^['"]use client['"];?/m.test(trimmedSource);
  if (
    process.env.DEBUG_RSC_PLUGIN &&
    this.resourcePath.includes('CounterClient')
  ) {
    console.log(
      '[rsc-server-loader] CounterClient source start:',
      source.slice(0, 80),
    );
  }

  const deriveExportNames = (): ExportName[] => {
    const names: ExportName[] = [];
    const defaultExportRegex =
      /export\s+(?:default|{\s*default\s*(?:as\s+([^\s,}]+))?\s*})/;
    if (defaultExportRegex.test(source)) {
      names.push({
        id: `${this.resourcePath}#default`,
        exportName: 'default',
      });
    }

    const namedExportRegex =
      /export\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = namedExportRegex.exec(source))) {
      const exportName = match[1];
      names.push({
        id: `${this.resourcePath}#${exportName}`,
        exportName,
      });
    }

    const exportListRegex = /export\s*{([^}]+)}/g;
    while ((match = exportListRegex.exec(source))) {
      const exports = match[1]
        .split(',')
        .map(token => token.trim())
        .filter(Boolean);
      for (const token of exports) {
        const [name] = token.split(/\s+as\s+/);
        if (!name || name === 'default') {
          continue;
        }
        names.push({
          id: `${this.resourcePath}#${name}`,
          exportName: name,
        });
      }
    }

    if (names.length === 0) {
      names.push({
        id: `${this.resourcePath}#default`,
        exportName: 'default',
      });
    }

    return names;
  };

  const shouldTreatAsClient =
    hasUseClientDirective || metadata?.directive === 'client';

  if (shouldTreatAsClient) {
    const exportNames =
      metadata?.directive === 'client' && metadata.exportNames.length > 0
        ? metadata.exportNames
        : deriveExportNames();
    if (exportNames.length > 0) {
      if (process.env.DEBUG_RSC_PLUGIN) {
        console.log(
          '[rsc-server-loader] registering client module',
          this.resourcePath,
          exportNames,
        );
      }
      setRscBuildInfo(this._module!, {
        type: 'client',
        resourcePath: this.resourcePath,
        clientReferences: exportNames,
      });
    }

    // Return a stub module for client components in server builds
    // This prevents server-side React code from executing in the main Node bundle
    const stubExports = exportNames
      .map(({ exportName }) => {
        if (exportName === 'default') {
          return 'export default function ClientComponentStub() { return null; }';
        }
        return `export const ${exportName} = function ClientComponentStub() { return null; };`;
      })
      .join('\n');

    const stubCode = `// Client component stub - actual component loaded on client\n${stubExports}\nexport const __rsc_client__ = true;\n`;

    return callback(null, stubCode, undefined);
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
