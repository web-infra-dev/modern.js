import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from '@rstest/core';
import { type BuilderConfig, createBuilder } from '../src';

const roots: string[] = [];
let originalNodeEnv: string | undefined;

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
});

afterEach(async () => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }
  await Promise.all(
    roots.splice(0).map(root => rm(root, { recursive: true, force: true })),
  );
});

async function buildArtifacts(
  config: BuilderConfig = {},
  source = 'console.log("builder-contract");',
) {
  const root = await mkdtemp(join(tmpdir(), 'modern-builder-contract-'));
  roots.push(root);
  const entry = join(root, 'index.js');
  await writeFile(entry, source);
  const builder = await createBuilder({
    bundlerType: 'rspack',
    cwd: root,
    config: {
      ...config,
      source: { entry: { main: entry }, ...config.source },
      output: {
        distPath: { root: 'dist', html: '' },
        filenameHash: false,
        minify: false,
        polyfill: 'off',
        disableTsChecker: true,
        sourceMap: false,
        overrideBrowserslist: ['chrome 80'],
        ...config.output,
      },
      performance: { buildCache: false, printFileSize: false },
    },
  });
  await builder.build();
  const dist = join(root, 'dist');
  const paths = await readdir(dist, { recursive: true, withFileTypes: true });
  return Object.fromEntries(
    await Promise.all(
      paths
        .filter(path => path.isFile())
        .map(async path => {
          const file = join(path.parentPath, path.name);
          const name = file.slice(dist.length + 1).replace(/\\/g, '/');
          return [name, await readFile(file, 'utf8')];
        }),
    ),
  ) as Record<string, string>;
}

const scripts = (files: Record<string, string>) =>
  Object.entries(files).filter(([name]) => name.endsWith('.js'));

const inlineScripts = (html: string) =>
  [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .join('\n');

describe('public builder build artifacts', () => {
  test('checkSyntax accepts ES2020 and rejects ES5 for the same optional chaining output', async () => {
    const source = 'console.log(globalThis.contract?.value);';
    // Keep optional chaining in the input while emitting an ES5 bundler wrapper,
    // so the incompatible diagnostic is about the input, not runtime syntax.
    const config: BuilderConfig = {
      source: { exclude: [/index\.js$/] },
      splitChunks: false,
      tools: { rspack: { target: ['web', 'es5'] } },
    };
    const files = await buildArtifacts(
      { ...config, security: { checkSyntax: { ecmaVersion: 2020 } } },
      source,
    );
    // Prove the compiler did not lower away the syntax being checked.
    expect(
      scripts(files)
        .map(([, code]) => code)
        .join('\n'),
    ).toContain('?.');
    await expect(
      buildArtifacts(
        { ...config, security: { checkSyntax: { ecmaVersion: 5 } } },
        source,
      ),
    ).rejects.toThrow(/incompatible syntax/);
  });

  test('enableAssetManifest lists emitted files but excludes maps from entrypoints', async () => {
    const files = await buildArtifacts({
      output: {
        enableAssetManifest: true,
        sourceMap: { js: 'source-map' },
      },
      splitChunks: false,
    });
    const manifest = JSON.parse(files['asset-manifest.json']);
    expect(files['main/index.html']).toBeDefined();
    expect(files['static/js/main.js']).toBeDefined();
    expect(files['static/js/main.js.map']).toBeDefined();
    expect(manifest.files).toEqual({
      'main.js': '/static/js/main.js',
      'main.js.map': '/static/js/main.js.map',
      'main/index.html': '/main/index.html',
    });
    expect(manifest.entrypoints).toEqual(['static/js/main.js']);
    expect(
      manifest.entrypoints.some((file: string) => file.endsWith('.map')),
    ).toBe(false);
  });

  test.each([
    { label: 'inline by default', options: {}, inline: true },
    {
      label: 'external when requested',
      options: { inlineScript: false },
      inline: false,
    },
  ])('assetsRetry is $label', async ({ options, inline }) => {
    const files = await buildArtifacts({ output: { assetsRetry: options } });
    const html = files['main/index.html'];
    const retry = scripts(files).filter(([name]) =>
      name.includes('assets-retry'),
    );
    if (inline) {
      expect(inlineScripts(html)).toContain('onRetry');
      expect(retry).toHaveLength(0);
    } else {
      expect(retry).toHaveLength(1);
      const [name, code] = retry[0];
      expect(code).toContain('onRetry');
      expect(html).toContain(`src="/${name}"`);
      expect(inlineScripts(html)).not.toContain('onRetry');
    }
  });

  test.each([
    { label: 'inline by default', output: {}, inline: true },
    {
      label: 'external when disabled',
      output: { disableInlineRuntimeChunk: true },
      inline: false,
    },
  ])('builder runtime is $label', async ({ output, inline }) => {
    const files = await buildArtifacts({ output });
    const html = files['main/index.html'];
    const runtime = scripts(files).filter(([name]) =>
      name.includes('builder-runtime'),
    );
    if (inline) {
      expect(runtime).toHaveLength(0);
      expect(inlineScripts(html)).toContain('__webpack_require__');
      expect(html).not.toMatch(/src="[^"]*builder-runtime/);
    } else {
      expect(runtime).toHaveLength(1);
      const [name, code] = runtime[0];
      expect(code).toContain('__webpack_require__');
      expect(html).toContain(`src="/${name}"`);
      expect(inlineScripts(html)).not.toContain('__webpack_require__');
    }
  });

  test('globalVars replaces configured values in emitted JavaScript', async () => {
    const files = await buildArtifacts(
      {
        source: {
          globalVars: { CONTRACT_TEXT: 'replaced-value', CONTRACT_COUNT: 42 },
        },
      },
      'console.log(CONTRACT_TEXT, CONTRACT_COUNT);',
    );
    const code = scripts(files)
      .map(([, source]) => source)
      .join('\n');
    expect(code).toMatch(/console\.log\("replaced-value",\s*42\)/);
    expect(code).not.toContain('CONTRACT_TEXT');
    expect(code).not.toContain('CONTRACT_COUNT');
  });
});
