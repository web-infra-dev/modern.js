import fs from 'node:fs';
import path from 'node:path';
import { createRsbuild, type Rspack } from '@rsbuild/core';
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import {
  findDuplicatePackages,
  pluginDuplicatePackages,
} from '../src/plugins/duplicatePackages';

// Written at test time: fixture `node_modules` directories are git-ignored.
const fixture = path.join(__dirname, '.tmp-duplicate-packages');
const FILES: Record<string, string> = {
  'src/index.js': [
    "import { version as a } from 'router';",
    "import { version as b } from 'app-lib';",
    "import { ui } from '@scope/ui';",
    'console.log(a, b, ui);',
    "import('./lazy.js');",
  ].join('\n'),
  'src/lazy.js':
    "import { version } from 'router'; export const lazy = version;",
  'node_modules/router/package.json':
    '{"name":"router","version":"7.1.0","main":"index.js"}',
  'node_modules/router/index.js': "export const version = '7';",
  'node_modules/app-lib/package.json':
    '{"name":"app-lib","version":"1.0.0","main":"index.js"}',
  'node_modules/app-lib/index.js': "export { version } from 'router';",
  'node_modules/app-lib/node_modules/router/package.json':
    '{"name":"router","version":"6.30.0","main":"index.js"}',
  'node_modules/app-lib/node_modules/router/index.js':
    "export const version = '6';",
  'node_modules/@scope/ui/package.json':
    '{"name":"@scope/ui","version":"2.0.0","main":"index.js"}',
  'node_modules/@scope/ui/index.js': "export const ui = 'ui';",
};

beforeAll(() => {
  for (const [file, content] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true });
    fs.writeFileSync(path.join(fixture, file), content);
  }
});

afterAll(() => {
  fs.rmSync(fixture, { recursive: true, force: true });
});

const compile = async (
  plugins: ReturnType<typeof pluginDuplicatePackages>[] = [],
): Promise<Rspack.Compilation> => {
  let compilation: Rspack.Compilation | undefined;
  const rsbuild = await createRsbuild({
    cwd: fixture,
    rsbuildConfig: {
      output: {
        distPath: { root: path.join(fixture, 'dist') },
        cleanDistPath: true,
      },
      performance: { printFileSize: false },
      plugins: [
        ...plugins,
        {
          name: 'grab-compilation',
          setup(api) {
            api.onAfterEnvironmentCompile(({ stats }) => {
              compilation = stats?.compilation;
            });
          },
        },
      ],
    },
  });
  await rsbuild.build();
  return compilation as Rspack.Compilation;
};

describe('findDuplicatePackages', () => {
  it('lists a package bundled from two versions in initial chunks', async () => {
    const duplicates = findDuplicatePackages(await compile());
    expect(
      duplicates.map(({ name, versions }) => ({
        name,
        versions: versions.map(item => item.version),
      })),
    ).toEqual([{ name: 'router', versions: ['6.30.0', '7.1.0'] }]);
  });

  it('ignores allowed packages', async () => {
    expect(
      findDuplicatePackages(await compile(), { allow: ['router'] }),
    ).toEqual([]);
  });
});

describe('pluginDuplicatePackages', () => {
  it('fails a production build with level: error', async () => {
    await expect(
      compile([pluginDuplicatePackages({ level: 'error' })]),
    ).rejects.toThrow(
      /1 package\(s\) are bundled in more than one version in the initial chunks[\s\S]*router\n {4}6\.30\.0/,
    );
  });
});
