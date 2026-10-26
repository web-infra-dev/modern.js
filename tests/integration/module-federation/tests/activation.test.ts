import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp,
  mkdir,
  writeFile,
  symlink,
  rm,
  readFile,
  readdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from '@rstest/core';

const nodeRequire = createRequire(__filename);
const exec = promisify(execFile);
const appTools = nodeRequire.resolve('@modern-js/app-tools');
const modern = path.resolve(path.dirname(appTools), '../../bin/modern.js');
const legacy = nodeRequire.resolve('@module-federation/modern-js-v3');
const workspaces: string[] = [];
afterEach(async () => {
  await Promise.all(
    workspaces
      .splice(0)
      .map(directory => rm(directory, { recursive: true, force: true })),
  );
});
async function run(
  config: string,
  options: {
    mf?: boolean | string;
    dependencies?: boolean;
    command?: 'inspect' | 'build';
    esm?: boolean;
  } = {},
) {
  const directory = await mkdtemp(path.join(tmpdir(), 'modern-mf-cli-'));
  workspaces.push(directory);
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name: 'mf-activation-test',
      private: true,
      type: options.esm ? 'module' : 'commonjs',
    }),
  );
  await mkdir(path.join(directory, 'src'));
  await writeFile(
    path.join(directory, 'src/index.ts'),
    'console.log("ordinary app");',
  );
  if (options.dependencies !== false) {
    const dependencyRoot = path.join(directory, 'node_modules');
    await mkdir(path.join(dependencyRoot, '@module-federation'), {
      recursive: true,
    });
    const hostRequire = createRequire(
      path.resolve(__dirname, '../host/package.json'),
    );
    for (const name of ['@module-federation/enhanced', 'typescript']) {
      let packageRoot = path.dirname(hostRequire.resolve(name));
      while (true) {
        try {
          const pkg = JSON.parse(
            await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
          );
          if (pkg.name === name) break;
        } catch {}
        const parent = path.dirname(packageRoot);
        if (parent === packageRoot) throw new Error('Cannot locate ' + name);
        packageRoot = parent;
      }
      await symlink(packageRoot, path.join(dependencyRoot, name), 'dir');
    }
  }
  await writeFile(
    path.join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2021',
        module: 'ESNext',
        moduleResolution: 'bundler',
        skipLibCheck: true,
      },
      include: ['src'],
    }),
  );
  if (options.mf)
    await writeFile(
      path.join(directory, 'module-federation.config.ts'),
      typeof options.mf === 'string'
        ? options.mf
        : 'export default { name: "activation_test", dts: false };',
    );
  await writeFile(
    path.join(directory, options.esm ? 'modern.config.js' : 'modern.config.ts'),
    `import { appTools } from ${JSON.stringify(options.esm ? path.resolve(path.dirname(appTools), '../esm-node/index.mjs') : appTools)};\n${config.includes('legacy()') ? `import legacy from ${JSON.stringify(legacy)}` : ''}\nexport default { source: { entries: { main: "./src/index.ts" }, disableDefaultEntries: true }, plugins: [appTools()], ${config} };`,
  );
  try {
    const result = await exec(
      process.execPath,
      [modern, options.command || 'inspect'],
      {
        cwd: directory,
        env: { ...process.env, NODE_ENV: 'production', NODE_PATH: '' },
        timeout: 60000,
        maxBuffer: 2 * 1024 * 1024,
      },
    );
    return { code: 0, output: result.stdout + result.stderr, directory };
  } catch (error: any) {
    return { code: error.code, output: error.stdout + error.stderr, directory };
  }
}
describe('CLI built-in MF activation', () => {
  it('does not require enhanced for an ordinary app or explicit false', async () => {
    expect((await run('', { dependencies: false })).code).toBe(0);
    expect(
      (await run('moduleFederation: false,', { mf: true, dependencies: false }))
        .code,
    ).toBe(0);
  });
  it('reports the installation requirement only for enabled apps', async () => {
    const result = await run('', { mf: true, dependencies: false });
    expect(result.code, result.output).not.toBe(0);
    expect(result.output).toContain('Install @module-federation/enhanced');
  });
  it('automatically enables the default config and accepts explicit inline options', async () => {
    expect((await run('', { mf: true })).code).toBe(0);
    expect(
      (
        await run(
          'moduleFederation: { config: { name: "inline", dts: false } },',
        )
      ).code,
    ).toBe(0);
  });
  it('rejects both plugin registration orders, including nested usePlugins', async () => {
    for (const plugins of [
      '[appTools(), legacy()]',
      '[legacy(), appTools()]',
      '[appTools(), { name: "wrapper", usePlugins: [legacy()] }]',
    ]) {
      const result = await run(`plugins: ${plugins},`, { mf: true });
      expect(result.code).not.toBe(0);
      expect(result.output).toContain('cannot be enabled together');
      expect(result.output).toContain('moduleFederation: false');
    }
  });
  it('keeps the legacy plugin working with explicit false', async () => {
    const result = await run(
      'plugins: [appTools(), legacy()], moduleFederation: false,',
      { mf: true },
    );
    expect(result.code, result.output).toBe(0);
  });
  it('builds usable remote declarations with DTS enabled and a custom output root', async () => {
    const result = await run(
      `output: { distPath: { root: 'custom-output' } }, moduleFederation: { config: { name: 'types_producer', exposes: { './Module': './src/index.ts' }, dts: { generateTypes: { compileInChildProcess: false, deleteTypesFolder: false }, consumeTypes: false } } },`,
      { command: 'build' },
    );
    expect(result.code, result.output).toBe(0);
    const output = path.join(result.directory, 'custom-output');
    const files = await readdir(output);
    expect(files).toContain('@mf-types.zip');
    const manifest = JSON.parse(
      await readFile(path.join(output, 'mf-manifest.json'), 'utf8'),
    );
    expect(manifest.metaData.types.zip).toBe('@mf-types.zip');
    expect(
      (await readFile(path.join(output, '@mf-types.zip'))).byteLength,
    ).toBeGreaterThan(0);
  });

  it('reports simultaneous integration before evaluating the legacy config', async () => {
    const result = await run('plugins: [legacy(), appTools()],', {
      mf: 'throw new Error("LEGACY_CONFIG_EVALUATED")',
    });
    expect(result.code).not.toBe(0);
    expect(result.output).toContain('cannot be enabled together');
    expect(result.output).not.toContain('LEGACY_CONFIG_EVALUATED');
  });
  it('builds client and server entries through the native ESM adapter', async () => {
    const result = await run(
      'server: { ssr: true }, moduleFederation: { config: { name: "esm_producer", exposes: { "./Module": "./src/index.ts" }, dts: false } },',
      { esm: true, command: 'build' },
    );
    expect(result.code, result.output).toBe(0);
    const manifest = JSON.parse(
      await readFile(
        path.join(result.directory, 'dist/mf-manifest.json'),
        'utf8',
      ),
    );
    expect(manifest.metaData.ssrRemoteEntry.type).toBe('commonjs-module');
  });
});
