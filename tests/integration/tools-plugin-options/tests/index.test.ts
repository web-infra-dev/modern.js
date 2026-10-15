import path from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild, runModernCommand } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');
const distDir = path.join(appDir, 'dist');
const targets = ['client', 'server'] as const;

/**
 * `modern inspect` prints every loader `use` item behind a chain-id comment
 * such as `/* config.module.rule('less').oneOf('less').use('less') *\/`.
 * Return the text of each block registered under `useId`, up to the next
 * comment.
 */
function getUseBlocks(config: string, useId: string): string[] {
  const marker = `.use('${useId}') */`;
  const blocks: string[] = [];
  let index = config.indexOf(marker);
  while (index !== -1) {
    const next = config.indexOf('/* config.module', index + marker.length);
    blocks.push(config.slice(index, next === -1 ? undefined : next));
    index = config.indexOf(marker, index + marker.length);
  }
  return blocks;
}

describe('tools.less / tools.sass / tools.svgr accept plugin-level options', () => {
  const configs = {} as Record<(typeof targets)[number], string>;

  beforeAll(async () => {
    await fs.remove(distDir);
    const res = await runModernCommand(['inspect'], {
      cwd: appDir,
      stdout: true,
      stderr: true,
    });
    expect(res.code).toBe(0);
    for (const target of targets) {
      configs[target] = await fs.readFile(
        path.join(distDir, `rspack.config.${target}.mjs`),
        'utf-8',
      );
    }
  });

  for (const target of targets) {
    test(`${target}: every less-loader use runs in parallel`, () => {
      const blocks = getUseBlocks(configs[target], 'less');
      expect(blocks.length).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(block).toMatch(/less-loader/);
        expect(block).toMatch(/parallel: true/);
        // lessLoaderOptions still reaches less-loader
        expect(block).toMatch(/javascriptEnabled: false/);
      }
    });

    test(`${target}: tools.sass.rewriteUrls=false removes resolve-url-loader`, () => {
      expect(getUseBlocks(configs[target], 'sass').length).toBeGreaterThan(0);
      expect(configs[target]).not.toMatch(/resolve-url-loader/);
    });

    test(`${target}: every svgr use runs in parallel with exportType 'default'`, () => {
      const blocks = getUseBlocks(configs[target], 'svgr');
      expect(blocks.length).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(block).toMatch(/plugin-svgr/);
        expect(block).toMatch(/parallel: true/);
        expect(block).toMatch(/exportType: 'default'/);
      }
    });
  }

  test('build succeeds with parallel less / svgr loaders', async () => {
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code).toBe(0);

    // route styles are minified (rgb(1, 2, 3) becomes #010203)
    const cssDir = path.join(distDir, 'static/css');
    expect(await fs.pathExists(cssDir)).toBe(true);
    const files = await fs.readdir(cssDir, { recursive: true });
    const css = (
      await Promise.all(
        files
          .map(String)
          .filter(file => file.endsWith('.css'))
          .map(file => fs.readFile(path.join(cssDir, file), 'utf-8')),
      )
    ).join('\n');
    expect(css).toMatch(/\.less-box\s*\{[^}]*(#010203|rgb\(1,\s*2,\s*3\))/);
    expect(css).toMatch(/\.scss-box\s*\{[^}]*(#040506|rgb\(4,\s*5,\s*6\))/);
  });
});
