import { createRequire } from 'node:module';
import path from 'node:path';
const root =
  process.env.MF_RSC_BASELINE ||
  path.resolve(import.meta.dirname, '../../../..');
const require = createRequire(
  path.join(root, 'packages/cli/builder/package.json'),
);
const { createRsbuild } = await import(require.resolve('@rsbuild/core'));
for (const version of ['v1', 'v2']) {
  process.env.PROBE_VERSION = version;
  const { default: config } = await import(
    `./rsbuild.config.mjs?version=${version}`
  );
  await (
    await createRsbuild({ cwd: import.meta.dirname, rsbuildConfig: config })
  ).build();
}
