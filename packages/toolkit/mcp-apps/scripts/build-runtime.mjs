import { execFileSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
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
}
