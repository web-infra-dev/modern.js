import { describe, expect, test, vi } from 'vitest';
import webpack from 'webpack';
import {
  setupServerHooks,
  isClientCompiler,
  getDevServerOptions,
} from '../src/devServer';

describe('test dev server', () => {
  test('should setupServerHooks correctly', () => {
    const compiler = webpack({});
    const onDoneFn = vi.fn();
    const onInvalidFn = vi.fn();

    setupServerHooks(compiler, {
      onDone: onDoneFn,
      onInvalid: onInvalidFn,
    });

    const isOnDoneRegistered = compiler.hooks.done.taps.some(
      tap => tap.fn === onDoneFn,
    );

    expect(isOnDoneRegistered).toBeTruthy();

    const isCompileHookRegistered = compiler.hooks.compile.taps.some(
      tap => tap.fn === onInvalidFn,
    );

    expect(isCompileHookRegistered).toBeTruthy();

    const isInvalidHookRegistered = compiler.hooks.invalid.taps.some(
      tap => tap.fn === onInvalidFn,
    );

    expect(isInvalidHookRegistered).toBeTruthy();
  });
  test('should not setupServerHooks when compiler is server', () => {
    const compiler = webpack({
      name: 'server',
    });
    const onDoneFn = vi.fn();
    const onInvalidFn = vi.fn();

    setupServerHooks(compiler, {
      onDone: onDoneFn,
      onInvalid: onInvalidFn,
    });

    const isOnDoneRegistered = compiler.hooks.done.taps.some(
      tap => tap.fn === onDoneFn,
    );

    expect(isOnDoneRegistered).toBeFalsy();
  });

  test('check isClientCompiler', () => {
    expect(isClientCompiler(webpack({}))).toBeTruthy();

    expect(
      isClientCompiler(
        webpack({
          target: ['web', 'es5'],
        }),
      ),
    ).toBeTruthy();

    expect(
      isClientCompiler(
        webpack({
          target: 'node',
        }),
      ),
    ).toBeFalsy();

    expect(
      isClientCompiler(
        webpack({
          target: ['node'],
        }),
      ),
    ).toBeFalsy();
  });

  test('getDevServerOptions', async () => {
    await expect(
      getDevServerOptions({
        builderConfig: {},
        serverOptions: {},
        port: 8080,
      }),
    ).resolves.toMatchInlineSnapshot(`
      {
        "config": {
          "bff": {},
          "html": {},
          "output": {
            "assetPrefix": undefined,
            "distPath": undefined,
            "path": undefined,
          },
          "runtime": {},
          "server": {},
          "source": {
            "alias": {},
            "define": {},
            "globalVars": {},
          },
          "tools": {
            "babel": {},
          },
        },
        "devConfig": {
          "client": {
            "port": "8080",
          },
          "devMiddleware": {
            "writeToDisk": [Function],
          },
          "hot": true,
          "https": undefined,
          "liveReload": true,
          "port": 8080,
          "watch": true,
        },
      }
    `);

    await expect(
      getDevServerOptions({
        builderConfig: {
          dev: {
            hmr: false,
            https: true,
          },
          output: {
            distPath: {
              root: 'dist',
            },
          },
          tools: {
            devServer: {
              client: {
                host: '',
                path: '',
              },
            },
          },
        },
        serverOptions: {
          runtime: {
            router: true,
            state: true,
          },
        },
        port: 8081,
      }),
    ).resolves.toMatchInlineSnapshot(`
      {
        "config": {
          "bff": {},
          "html": {},
          "output": {
            "assetPrefix": undefined,
            "distPath": {
              "root": "dist",
            },
            "path": "dist",
          },
          "runtime": {},
          "server": {},
          "source": {
            "alias": {},
            "define": {},
            "globalVars": {},
          },
          "tools": {
            "babel": {},
          },
        },
        "devConfig": {
          "client": {
            "host": "",
            "path": "",
            "port": "8081",
          },
          "devMiddleware": {
            "writeToDisk": [Function],
          },
          "hot": false,
          "https": true,
          "liveReload": false,
          "port": 8081,
          "watch": true,
        },
      }
    `);
  });
});
