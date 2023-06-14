import { join, resolve } from 'path';
import { fs } from '@modern-js/utils';
import { expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

const fixtures = __dirname;

const generatorTempDir = async (testDir: string) => {
  await fs.emptyDir(testDir);
  await fs.copy(join(fixtures, 'src'), testDir);

  return () => fs.remove(testDir);
};

webpackOnlyTest(
  'should generator ts declaration correctly for css modules auto true',
  async () => {
    const testDir = join(fixtures, 'test-src-1');
    const clear = await generatorTempDir(testDir);

    await build({
      cwd: __dirname,
      entry: { index: resolve(testDir, 'index.js') },
      builderConfig: {
        output: {
          disableSourceMap: true,
          enableCssModuleTSDeclaration: true,
        },
      },
    });

    expect(fs.existsSync(join(testDir, './a.css.d.ts'))).toBeFalsy();
    expect(fs.existsSync(join(testDir, './b.module.scss.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, './c.module.less.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, './d.global.less.d.ts'))).toBeFalsy();

    expect(
      fs.readFileSync(join(testDir, './b.module.scss.d.ts'), {
        encoding: 'utf-8',
      }),
    ).toMatch(/'the-b-class': string;/);

    await clear();
  },
);

webpackOnlyTest(
  'should generator ts declaration correctly for css modules auto function',
  async () => {
    const testDir = join(fixtures, 'test-src-2');
    const clear = await generatorTempDir(testDir);

    await build({
      cwd: __dirname,
      entry: { index: resolve(testDir, 'index.js') },
      builderConfig: {
        output: {
          disableSourceMap: true,
          enableCssModuleTSDeclaration: true,
        },
        tools: {
          cssLoader: {
            modules: {
              auto: path => {
                return path.endsWith('.less');
              },
            },
          },
        },
      },
    });

    expect(fs.existsSync(join(testDir, './a.css.d.ts'))).toBeFalsy();
    expect(fs.existsSync(join(testDir, './b.module.scss.d.ts'))).toBeFalsy();
    expect(fs.existsSync(join(testDir, './c.module.less.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, './d.global.less.d.ts'))).toBeTruthy();

    await clear();
  },
);

webpackOnlyTest(
  'should generator ts declaration correctly for css modules auto Regexp',
  async () => {
    const testDir = join(fixtures, 'test-src-3');
    const clear = await generatorTempDir(testDir);

    await build({
      cwd: __dirname,
      entry: { index: resolve(testDir, 'index.js') },
      builderConfig: {
        output: {
          disableSourceMap: true,
          enableCssModuleTSDeclaration: true,
        },
        tools: {
          cssLoader: {
            modules: {
              auto: /\.module\./i,
            },
          },
        },
      },
    });

    expect(fs.existsSync(join(testDir, './a.css.d.ts'))).toBeFalsy();
    expect(fs.existsSync(join(testDir, './b.module.scss.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, './c.module.less.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(testDir, './d.global.less.d.ts'))).toBeFalsy();

    await clear();
  },
);
