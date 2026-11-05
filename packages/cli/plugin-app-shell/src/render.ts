import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createRsbuild, type RsbuildConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export interface RenderShellsOptions {
  appDirectory: string;
  /** Directory for the temporary node bundle; must live inside the app so `react` resolves. */
  workDirectory: string;
  /** Shell component module path keyed by entry name. */
  components: Record<string, string>;
  alias?: Record<string, string | string[]>;
  define?: Record<string, string>;
}

const ENTRY_TEMPLATE = (componentPath: string): string =>
  [
    `import { createElement } from 'react';`,
    `import { renderToStaticMarkup } from 'react-dom/server';`,
    `import Shell from ${JSON.stringify(componentPath)};`,
    `export function render() { return renderToStaticMarkup(createElement(Shell)); }`,
  ].join('\n');

type ShellBundle = { render: () => string };

/**
 * Compile every shell component into one node bundle with the app's own `react`,
 * then render each one to static markup.
 */
export const renderShells = async ({
  appDirectory,
  workDirectory,
  components,
  alias,
  define,
}: RenderShellsOptions): Promise<Record<string, string>> => {
  const entryNames = Object.keys(components);
  if (entryNames.length === 0) {
    return {};
  }
  fs.rmSync(workDirectory, { recursive: true, force: true });
  const sourceDir = path.join(workDirectory, 'src');
  const outDir = path.join(workDirectory, 'dist');
  fs.mkdirSync(sourceDir, { recursive: true });

  const entry: Record<string, string> = {};
  for (const name of entryNames) {
    const file = path.join(sourceDir, `${name}.jsx`);
    fs.writeFileSync(
      file,
      ENTRY_TEMPLATE(path.resolve(appDirectory, components[name])),
    );
    entry[name] = file;
  }

  const rsbuildConfig: RsbuildConfig = {
    source: { entry, define },
    resolve: alias ? { alias } : undefined,
    output: {
      target: 'node',
      distPath: { root: outDir, js: '.' },
      filename: { js: '[name].js' },
      minify: false,
      sourceMap: false,
      cleanDistPath: true,
      // Keep a single React copy: resolve it from the app at render time.
      externals: [/^react(-dom)?(\/.*)?$/],
    },
    performance: { chunkSplit: { strategy: 'all-in-one' } },
    plugins: [pluginReact()],
  };
  const rsbuild = await createRsbuild({
    cwd: appDirectory,
    rsbuildConfig,
    loadEnv: false,
  });
  await rsbuild.build();

  const requireFromWork = createRequire(path.join(outDir, 'index.js'));
  const result: Record<string, string> = {};
  for (const name of entryNames) {
    const bundlePath = path.join(outDir, `${name}.js`);
    delete requireFromWork.cache[bundlePath];
    const bundle = requireFromWork(bundlePath) as ShellBundle;
    result[name] = bundle.render();
  }
  fs.rmSync(workDirectory, { recursive: true, force: true });
  return result;
};
