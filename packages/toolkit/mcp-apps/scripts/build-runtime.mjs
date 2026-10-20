import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const bin = path.join(
  path.dirname(require.resolve('@rsbuild/core/package.json')),
  'bin/rsbuild.js',
);
await rm(path.join(root, 'dist/runtime'), { recursive: true, force: true });
for (const mode of ['production', 'development']) {
  execFileSync(
    process.execPath,
    [bin, 'build', '-c', 'rsbuild.runtime.config.mts'],
    {
      cwd: root,
      env: { ...process.env, MCP_APPS_RUNTIME_MODE: mode },
      stdio: 'inherit',
    },
  );
  const name = mode === 'development' ? 'mcp-app.dev' : 'mcp-app';
  const htmlPath = path.join(root, 'dist/runtime', `${name}.html`);
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(
    path.join(root, 'dist/runtime', `${name}.runtime.mjs`),
    `export default ${JSON.stringify(html)};\n`,
  );
  await rm(htmlPath);
}
