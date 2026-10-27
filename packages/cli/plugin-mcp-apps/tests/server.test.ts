import path from 'node:path';
import { it, expect } from '@rstest/core';
import serverPlugin from '../src/server';

it.each([
  [
    undefined,
    'production',
    path.join('/deployment/custom-output', 'mcp-apps/ui-manifest.json'),
  ],
  [
    '/app/custom-internal/mcp-apps/ui-manifest.json',
    'development',
    '/app/custom-internal/mcp-apps/ui-manifest.json',
  ],
])(
  'injects manifest configuration from the server instance',
  async (developmentManifest, mode, manifest) => {
    const middlewares: any[] = [];
    let prepare!: () => void;
    serverPlugin({ developmentManifest }).setup({
      onPrepare: (callback: () => void) => {
        prepare = callback;
      },
      getServerContext: () => ({
        distDirectory: '/deployment/custom-output',
        middlewares,
      }),
    } as never);
    prepare();
    const locals = { existing: true };
    let result: unknown;
    await middlewares[0].handler(
      {
        get: () => locals,
        set: (_key: string, value: unknown) => {
          result = value;
        },
      },
      async () => {},
    );
    expect(middlewares[0].before).toContain('bind-bff');
    expect(result).toEqual({ ...locals, modernMcpApps: { manifest, mode } });
  },
);
