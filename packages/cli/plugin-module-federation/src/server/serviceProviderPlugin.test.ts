import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import serviceProviderPlugin from './serviceProviderPlugin';
import { createBridgeServiceMiddleware } from './service';

rs.mock('./service', () => ({
  createBridgeServiceMiddleware: rs.fn(options =>
    Object.assign(async () => new Response(options.module), {
      dispose: rs.fn(async () => {}),
    }),
  ),
}));
const directories: string[] = [];
afterEach(async () => {
  rs.clearAllMocks();
  await Promise.all(
    directories
      .splice(0)
      .map(directory => rm(directory, { recursive: true, force: true })),
  );
});

describe('built-in Service producer server plugin', () => {
  it('keeps admitted requests on the old Service until invalidation and preparation complete', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'modern-service-generation-'),
    );
    directories.push(directory);
    const filename = path.join(directory, 'mf-manifest.json');
    const publish = (name: string) =>
      writeFile(
        filename,
        JSON.stringify({
          name,
          metaData: { serviceBaseUrl: 'https://weather.example/' },
          exposes: [{ name: 'App', path: './App', servicePath: 'render' }],
        }),
      );
    await publish('weather_v1');
    const context: any = {
      distDirectory: directory,
      middlewares: [],
      ssrUpdateManager: {},
    };
    serviceProviderPlugin({
      manifestFileName: 'mf-manifest.json',
      basePaths: ['/'],
    }).setup!({
      onPrepare: (callback: () => void) => callback(),
      getServerContext: () => ({ ...context }),
      updateServerContext: (value: any) => Object.assign(context, value),
    } as any);
    const request = () =>
      context.middlewares[0].handler(
        {
          req: {
            raw: new Request('http://localhost/render', { method: 'POST' }),
          },
        },
        rs.fn(),
      );
    expect(await (await request()).text()).toBe('weather_v1/App');
    const oldHandler = rs.mocked(createBridgeServiceMiddleware).mock.results[0]
      .value;
    await publish('weather_v2');
    expect(await (await request()).text()).toBe('weather_v1/App');
    expect(oldHandler.dispose).not.toHaveBeenCalled();
    await context.ssrUpdateParticipants[0].invalidate();
    await context.ssrUpdateParticipants[0].prepare();
    expect(oldHandler.dispose).toHaveBeenCalledTimes(1);
    expect(await (await request()).text()).toBe('weather_v2/App');
    const newHandler = rs.mocked(createBridgeServiceMiddleware).mock.results[1]
      .value;
    await context.ssrUpdateParticipants[0].dispose();
    expect(newHandler.dispose).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'https://cdn.example/assets/',
      'https://cdn.example/assets/static/weather.json',
    ],
    ['auto', 'https://weather.example/static/weather.json'],
    ['/assets/', 'https://weather.example/assets/static/weather.json'],
  ])(
    'resolves the local snapshot manifest base for publicPath %s',
    async (publicPath, expectedUrl) => {
      const directory = await mkdtemp(
        path.join(tmpdir(), 'modern-service-provider-assets-'),
      );
      directories.push(directory);
      await mkdir(path.join(directory, 'static'));
      const manifest = {
        name: 'weather',
        metaData: {
          serviceBaseUrl: 'https://weather.example/apps/',
          publicPath,
          ssrPublicPath: 'https://node-assets.example/server/',
        },
        exposes: [{ name: 'App', path: './App', servicePath: 'render' }],
      };
      await writeFile(
        path.join(directory, 'static/weather.json'),
        JSON.stringify(manifest),
      );
      const middlewares: any[] = [];
      const plugin = serviceProviderPlugin({
        manifestFileName: 'static/weather.json',
        basePaths: ['/apps/'],
      });
      plugin.setup!({
        onPrepare(callback: () => void) {
          callback();
        },
        getServerContext: () => ({ distDirectory: directory, middlewares }),
        updateServerContext: rs.fn(),
      } as any);
      await middlewares[0].handler(
        {
          req: {
            raw: new Request('http://localhost/apps/render', {
              method: 'POST',
            }),
          },
        },
        rs.fn(),
      );
      expect(
        rs.mocked(createBridgeServiceMiddleware).mock.calls[0][0].manifest,
      ).toEqual({ url: expectedUrl, data: manifest });
    },
  );

  it('starts before build output exists and lazily reads the local manifest, including path overrides', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'modern-service-provider-'),
    );
    directories.push(directory);
    const middlewares: any[] = [];
    const plugin = serviceProviderPlugin({
      manifestFileName: 'static/weather.json',
      basePaths: ['/new/', '/old/'],
      cache: { maxAgeMs: 100 },
    });
    plugin.setup!({
      onPrepare(callback: () => void) {
        callback();
      },
      getServerContext: () => ({ distDirectory: directory, middlewares }),
      updateServerContext: rs.fn(),
    } as any);
    expect(createBridgeServiceMiddleware).not.toHaveBeenCalled();
    await mkdir(path.join(directory, 'static'));
    const manifest = {
      name: 'weather',
      metaData: { serviceBaseUrl: 'https://external-gateway.invalid/new/' },
      exposes: [
        { path: './App', servicePath: 'custom/render' },
        { path: './Button' },
      ],
    };
    await writeFile(
      path.join(directory, 'static/weather.json'),
      JSON.stringify(manifest),
    );
    const next = rs.fn();
    for (const prefix of ['/new/', '/old/']) {
      const result = await middlewares[0].handler(
        {
          req: {
            raw: new Request(`http://localhost${prefix}custom/render`, {
              method: 'POST',
            }),
          },
        },
        next,
      );
      expect(await result.text()).toBe('weather/App');
    }
    expect(createBridgeServiceMiddleware).toHaveBeenCalledTimes(2);
    expect(
      rs.mocked(createBridgeServiceMiddleware).mock.calls[0][0],
    ).toMatchObject({ manifest: { data: manifest }, cache: { maxAgeMs: 100 } });
    await middlewares[0].handler(
      {
        req: {
          raw: new Request('http://localhost/business', { method: 'POST' }),
        },
      },
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
