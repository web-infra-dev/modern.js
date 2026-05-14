import { CHUNK_CSS_PLACEHOLDER } from '../../../../src/core/server/constants';
import { buildShellBeforeTemplate } from '../../../../src/core/server/stream/beforeTemplate';

describe('buildShellBeforeTemplate', () => {
  it('should use shared matched route ids from the router snapshot for css injection', async () => {
    const html = await buildShellBeforeTemplate(
      `<html><head>${CHUNK_CSS_PLACEHOLDER}</head><body></body></html>`,
      {
        entryName: 'main',
        runtimeContext: {
          routeManifest: {
            routeAssets: {
              'route-a': {
                referenceCssAssets: ['/assets/route-a.css'],
              },
            },
          },
          routerServerSnapshot: {
            matchedRouteIds: ['route-a'],
          },
        } as any,
        config: {} as any,
      },
    );

    expect(html).toContain('/assets/route-a.css');
  });

  it('should derive css route ids from generic match snapshots', async () => {
    const html = await buildShellBeforeTemplate(
      `<html><head>${CHUNK_CSS_PLACEHOLDER}</head><body></body></html>`,
      {
        entryName: 'main',
        runtimeContext: {
          routeManifest: {
            routeAssets: {
              'asset-route': {
                referenceCssAssets: ['/assets/asset-route.css'],
              },
              legacy: {
                referenceCssAssets: ['/assets/legacy.css'],
              },
            },
          },
          routerServerSnapshot: {
            matches: [{ routeId: 'router-route', assetRouteId: 'asset-route' }],
          },
          tanstackMatchedModernRouteIds: ['legacy'],
        } as any,
        config: {} as any,
      },
    );

    expect(html).toContain('/assets/asset-route.css');
    expect(html).not.toContain('/assets/legacy.css');
  });
});
