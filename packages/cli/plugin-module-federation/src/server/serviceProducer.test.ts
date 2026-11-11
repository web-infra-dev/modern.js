import { afterEach, describe, expect, it } from '@rstest/core';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { Manifest } from '@module-federation/sdk';
import { createBridgeServiceMiddleware } from './service';

const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

const protocol = 'module-federation/bridge-ssr/producer/v1';

describe('producer local Snapshot resource addresses', () => {
  it.each(['root-relative', 'path-relative', 'auto', 'absolute-cdn'])(
    'loads and executes the real HTTP Node expose with %s resource prefixes',
    async mode => {
      const name = `service_assets_${randomUUID().replaceAll('-', '')}`;
      const requested: string[] = [];
      const entryPath =
        mode === 'absolute-cdn' || mode === 'auto'
          ? '/server/remoteEntry.js'
          : '/assets/server/remoteEntry.js';
      const server = createServer((request, response) => {
        requested.push(request.url!);
        if (request.url !== entryPath) {
          response.writeHead(404);
          response.end('Unexpected asset URL');
          return;
        }
        response.setHeader('content-type', 'application/javascript');
        response.end(`module.exports = {
          init() {},
          get(expose) {
            if (expose !== './App') throw Error('Unexpected expose');
            return Promise.resolve(() => ({ default: () => ({
              async renderStream(info) {
                return {
                  protocol: ${JSON.stringify(protocol)},
                  hydration: 'progressive',
                  abort() {},
                  messages: new ReadableStream({
                    start(controller) {
                      controller.enqueue({ type: 'html', html: '<div>HTTP factory: ' + info.props.city + '</div>' });
                      controller.enqueue({ type: 'ready', snapshot: { city: info.props.city } });
                      controller.enqueue({ type: 'done' });
                      controller.close();
                    }
                  })
                };
              }
            }) }));
          }
        };`);
      });
      servers.push(server);
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      const publicPath =
        mode === 'absolute-cdn'
          ? `${origin}/browser/`
          : mode === 'auto'
            ? 'auto'
            : mode === 'root-relative'
              ? '/assets/'
              : 'assets/';
      const ssrPublicPath =
        mode === 'absolute-cdn'
          ? `${origin}/server/`
          : mode === 'auto'
            ? '/server/'
            : mode === 'root-relative'
              ? '/assets/server/'
              : 'assets/server/';
      const manifest: Manifest = {
        id: name,
        name,
        metaData: {
          name,
          globalName: name,
          type: 'app',
          publicPath,
          ssrPublicPath,
          serviceBaseUrl: `${mode === 'absolute-cdn' ? 'https://service.invalid' : origin}/application/`,
          buildInfo: { buildVersion: 'test-build', buildName: name },
          remoteEntry: { name: 'browser.js', path: '', type: 'global' },
          ssrRemoteEntry: {
            name: 'remoteEntry.js',
            path: '',
            type: 'commonjs-module',
          },
        },
        exposes: [
          {
            id: `${name}:App`,
            name: 'App',
            path: './App',
            render: 'bridge',
            servicePath: 'render',
            assets: {
              js: { sync: [], async: [] },
              css: { sync: [], async: [] },
            },
          },
        ],
        shared: [],
        remotes: [],
      };
      const handler = createBridgeServiceMiddleware({
        path: '/application/render',
        module: `${name}/App`,
        manifest: { url: `${origin}/mf-manifest.json`, data: manifest },
      });
      const result = await handler(
        {
          req: {
            raw: new Request(`${origin}/application/render`, {
              method: 'POST',
              body: JSON.stringify({
                protocol,
                buildVersion: 'test-build',
                request: {
                  instanceId: 'weather',
                  identifierPrefix: 'weather-',
                  moduleName: `${name}/App`,
                  url: 'https://host.example/weather',
                  basename: '/weather',
                  props: { city: 'Hangzhou' },
                },
              }),
            }),
          },
        },
        async () => {
          throw Error('Service route was not handled');
        },
      );
      expect(result?.status).toBe(200);
      const frames = (await result!.text())
        .trim()
        .split('\n')
        .map(line => JSON.parse(line));
      expect(frames).toContainEqual({
        type: 'html',
        html: '<div>HTTP factory: Hangzhou</div>',
      });
      expect(frames.at(-1)).toEqual({ type: 'done' });
      expect(requested).toEqual([entryPath]);
      expect(manifest.metaData).toMatchObject({ publicPath, ssrPublicPath });
    },
  );
});
