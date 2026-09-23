import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Convert Vmok metadata to standard MF data without executing remote code. */
export function normalizeVmokManifest(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.metaData)) {
    throw new Error('Invalid Vmok manifest metadata');
  }
  const metaData = { ...value.metaData };
  let publicPath = metaData.publicPath;
  if (typeof metaData.getPublicPath === 'string') {
    // The SCM templates emit: return "https://cdn/path/".
    // Accept only a JSON string literal, never a function or an expression.
    const match = /^\s*return\s+("(?:[^"\\\r\n]|\\.)*")\s*;?\s*$/.exec(
      metaData.getPublicPath,
    );
    if (!match?.[1]) {
      throw new Error(
        'Vmok getPublicPath must return a constant JSON string for CSP-safe MCP Apps; dynamic JavaScript is unsupported',
      );
    }
    publicPath = JSON.parse(match[1]);
  }
  if (typeof publicPath !== 'string') {
    throw new Error('Vmok manifest is missing a static publicPath');
  }
  let resolvedPath: string = publicPath;
  if (resolvedPath.includes('__CDN_PREFIX__')) {
    // The Vmok configuration currently targets the CN region.
    const cdn = isRecord(metaData.region) ? metaData.region.cn : undefined;
    if (typeof cdn !== 'string' || !cdn) {
      throw new Error('Vmok manifest is missing region.cn for __CDN_PREFIX__');
    }
    resolvedPath = resolvedPath.replaceAll('__CDN_PREFIX__', cdn);
  }
  if (resolvedPath.startsWith('//')) {
    resolvedPath = `https:${resolvedPath}`;
  }
  const url = new URL(resolvedPath);
  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new Error('Vmok publicPath must be an HTTP(S) URL');
  }
  metaData.publicPath = resolvedPath;
  delete metaData.getPublicPath;
  return { ...value, metaData };
}

export function createVmokManifestPlugin(
  manifestUrl: string,
): ModuleFederationRuntimePlugin {
  return {
    name: 'modern-mcp-vmok-static-public-path',
    fetch(url, options) {
      if (url !== manifestUrl) {
        return;
      }
      return fetch(url, options).then(async response => {
        if (!response.ok) {
          return response;
        }
        const manifest = normalizeVmokManifest(await response.json());
        return new Response(JSON.stringify(manifest), {
          headers: { 'Content-Type': 'application/json' },
        });
      });
    },
  };
}
