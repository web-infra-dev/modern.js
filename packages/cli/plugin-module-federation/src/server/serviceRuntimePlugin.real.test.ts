import path from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { expect, it } from '@rstest/core';
import { SSRPublicPathPlugin } from '@module-federation/rsbuild-plugin/utils';
import { createBridgeServiceHandler } from '@module-federation/bridge-react/service-node';
import type { BridgeSSRMessage } from '@module-federation/bridge-react/ssr';

const nodeRequire = createRequire(__filename);
const { rspack } = nodeRequire('@rspack/core') as typeof import('@rspack/core');
const { ModuleFederationPlugin } = nodeRequire(
  '@module-federation/enhanced/rspack',
) as typeof import('@module-federation/enhanced/rspack');
const packageRoot = path.join(__dirname, '../..');
const fixtures = path.join(packageRoot, 'tests/fixtures/service-runtime');
const protocol = 'module-federation/bridge-ssr/producer/v1';

async function compile(config: import('@rspack/core').Configuration) {
  const compiler = rspack(config);
  await new Promise<void>((resolve, reject) => {
    compiler.run((error, stats) => {
      compiler.close(closeError => {
        if (error || closeError) reject(error || closeError);
        else if (stats?.hasErrors())
          reject(new Error(stats.toString({ all: false, errors: true })));
        else resolve();
      });
    });
  });
}

it('loads real nested ordinary Node containers without private Service context, then uses scoped HTTP policies', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'modern-service-nested-'));
  const assets: string[] = [];
  const authenticated: Array<Record<string, string>> = [];
  const rendered: Array<Record<string, unknown>> = [];
  const producer = createBridgeServiceHandler({
    async buildVersion() {
      const manifest = JSON.parse(
        await readFile(path.join(root, 'weather/mf-manifest.json'), 'utf8'),
      );
      return manifest.metaData.buildInfo.buildVersion;
    },
    authorize(request) {
      authenticated.push(Object.fromEntries(request.headers));
      if (
        request.headers.get('authorization') !== 'private-host-a-service-token'
      )
        return new Response('Unauthorized', { status: 401 });
    },
    async render(info) {
      rendered.push({
        moduleName: info.moduleName,
        headers: info.headers,
        props: info.props,
      });
      let controller: ReadableStreamDefaultController<BridgeSSRMessage>;
      return {
        protocol,
        hydration: 'progressive',
        abort(reason) {
          if (info.props.slow) controller.error(reason);
        },
        messages: new ReadableStream<BridgeSSRMessage>({
          start(stream) {
            controller = stream;
            stream.enqueue({
              type: 'html',
              html: `<p>HTTP weather:${info.props.station}</p>`,
            });
            stream.enqueue({
              type: 'ready',
              snapshot: { station: info.props.station },
            });
            if (!info.props.slow) {
              stream.enqueue({ type: 'done' });
              stream.close();
            }
          },
        }),
      };
    },
  });
  const server = createServer((request, response) => {
    void (async () => {
      if (request.url === '/weather/render') {
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(chunk);
        const result = await producer(
          new Request(`${origin}${request.url}`, {
            method: request.method,
            headers: request.headers as Record<string, string>,
            body: Buffer.concat(chunks),
          }),
        );
        response.writeHead(result.status, Object.fromEntries(result.headers));
        const body = Readable.fromWeb(result.body!);
        body.on('error', () => response.destroy());
        response.on('close', () => body.destroy());
        body.pipe(response);
        return;
      }
      assets.push(request.url!);
      const file = path.join(root, request.url!);
      const body = await readFile(file);
      response.setHeader(
        'content-type',
        file.endsWith('.json') ? 'application/json' : 'application/javascript',
      );
      response.end(body);
    })().catch(error => {
      response.writeHead(500);
      response.end(String(error));
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    for (const name of ['remote-b', 'weather']) {
      await compile({
        mode: 'development',
        context: fixtures,
        target: 'async-node',
        entry: {},
        devtool: false,
        resolve: {
          extensions: ['.ts', '.js'],
          modules: ['node_modules', path.join(packageRoot, 'node_modules')],
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              use: {
                loader: 'builtin:swc-loader',
                options: { jsc: { parser: { syntax: 'typescript' } } },
              },
            },
          ],
        },
        output: {
          path: path.join(root, name),
          filename: '[name].js',
          chunkFilename: '[name].js',
          publicPath: `${origin}/${name}/`,
          chunkFormat: 'commonjs',
          chunkLoading: 'async-node',
          library: { type: 'commonjs-module' },
          uniqueName: name,
        },
        optimization: { minimize: false },
        plugins: [
          new SSRPublicPathPlugin(),
          new ModuleFederationPlugin({
            name,
            filename: 'remoteEntry.js',
            library: { type: 'commonjs-module' },
            shareStrategy: 'loaded-first',
            remoteType: 'script',
            dts: false,
            bridge: { enableBridgeRouter: false },
            remotes:
              name === 'weather'
                ? { downstream: `remote-b@${origin}/remote-b/mf-manifest.json` }
                : {},
            exposes: {
              './Card': name === 'weather' ? './card.js' : './downstream.js',
              './Service': './service.js',
            },
            runtimePlugins: [
              nodeRequire.resolve('@module-federation/node/runtimePlugin'),
              [path.join(__dirname, 'serviceRuntimePlugin.ts'), { name }],
            ],
            manifest: {
              additionalData({ stats }) {
                stats.metaData.serviceBaseUrl = `${origin}/${name}/`;
                stats.metaData.buildInfo.buildVersion = 'nested-service-build';
                for (const expose of stats.exposes) {
                  if (expose.name === 'Service') {
                    expose.render = 'bridge';
                    expose.servicePath = 'render';
                  }
                }
                return stats;
              },
            },
          }),
        ],
      });
    }
    // Credentials originate only in the server bootstrap, never the downloadable
    // Node containers, chunks or manifests.
    for (const name of ['remote-b', 'weather']) {
      for (const entry of await readdir(path.join(root, name))) {
        const contents = await readFile(path.join(root, name, entry), 'utf8');
        expect(contents).not.toContain('private-host-a-service-token');
        expect(contents).not.toContain('host-private-cookie');
      }
    }
    const child = await promisify(execFile)(
      process.execPath,
      [
        path.join(fixtures, 'host.cjs'),
        JSON.stringify({
          jiti: nodeRequire.resolve('jiti'),
          runtime: nodeRequire.resolve('@module-federation/enhanced/runtime'),
          renderer: nodeRequire.resolve('react-dom/server'),
          config: path.join(__dirname, 'serviceConfig.ts'),
          plugin: path.join(__dirname, 'serviceRuntimePlugin.ts'),
          weather: `${origin}/weather/mf-manifest.json`,
        }),
      ],
      { timeout: 30000 },
    );
    expect(child.stdout).toContain('Verified ordinary A -> weather -> B');
    expect(assets).toContain('/weather/remoteEntry.js');
    expect(assets).toContain('/remote-b/remoteEntry.js');
    expect(assets.filter(asset => asset.includes('service_js'))).toEqual([]);
    expect(authenticated).toHaveLength(2);
    for (const headers of authenticated) {
      expect(headers.authorization).toBe('private-host-a-service-token');
      expect(headers.cookie).toBeUndefined();
      expect(headers['x-user']).toBeUndefined();
    }
    expect(rendered).toEqual([
      {
        moduleName: 'forecast/Service',
        headers: { 'x-user': 'alice' },
        props: { station: 'Hangzhou' },
      },
      {
        moduleName: 'forecast/Service',
        headers: { 'x-user': 'alice' },
        props: { slow: true },
      },
    ]);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  }
}, 60000);
