import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRsbuild } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const root = fileURLToPath(new URL('..', import.meta.url));
await rm(path.join(root, 'dist/runtime'), { recursive: true, force: true });
for (const development of [false, true]) {
  const name = development ? 'mcp-app.dev' : 'mcp-app';
  const rsbuild = await createRsbuild({
    cwd: root,
    rsbuildConfig: {
      mode: 'production',
      plugins: [pluginReact()],
      source: {
        entry: { [name]: './src/mf-runtime/mcp-app.tsx' },
        define: {
          'process.env.NODE_ENV': JSON.stringify(
            development ? 'development' : 'production',
          ),
        },
      },
      html: { title: 'MF Render Container', inject: 'body' },
      output: {
        distPath: { root: './dist/runtime' },
        inlineScripts: true,
        inlineStyles: true,
        legalComments: 'inline',
        cleanDistPath: false,
      },
      tools: {
        rspack: {
          optimization: { nodeEnv: false },
          module: { parser: { javascript: { dynamicImportMode: 'eager' } } },
        },
      },
    },
  });
  await rsbuild.build();
  const htmlPath = path.join(root, 'dist/runtime', `${name}.html`);
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(
    path.join(root, 'dist/runtime', `${name}.runtime.mjs`),
    `export default ${JSON.stringify(html)};\n`,
  );
  await rm(htmlPath);
}
