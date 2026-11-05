import fs from 'node:fs';
import path from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import {
  type PerformanceBudgetOptions,
  type PerformanceReport,
  checkBudgets,
  formatReportMarkdown,
  parseSize,
  pluginPerformanceBudget,
} from '../src/plugins/performanceBudget';

// Written at test time: fixture `node_modules` directories are git-ignored.
const fixture = path.join(__dirname, '.tmp-performance-budget');
const FILES: Record<string, string> = {
  'src/index.js': [
    "import './style.css';",
    "import { version } from 'lib';",
    'console.log(version);',
    'import(/* webpackChunkName: "shell" */ \'./shell.js\');',
  ].join('\n'),
  'src/style.css': `.a{color:red}${'.b{margin:0}'.repeat(50)}`,
  'src/shell.js':
    'export const load = () => import(/* webpackChunkName: "editor" */ \'./editor.js\');\nload();',
  'src/editor.js': `export const editor = ${JSON.stringify('x'.repeat(2000))};`,
  'node_modules/lib/package.json':
    '{"name":"lib","version":"1.0.0","main":"index.js"}',
  'node_modules/lib/index.js': "export const version = '1';",
};

const build = async (options: PerformanceBudgetOptions) => {
  const distPath = path.join(
    fixture,
    `dist-${Math.random().toString(36).slice(2)}`,
  );
  const rsbuild = await createRsbuild({
    cwd: fixture,
    rsbuildConfig: {
      output: { distPath: { root: distPath }, filenameHash: false },
      performance: { printFileSize: false },
      plugins: [pluginPerformanceBudget(options)],
    },
  });
  await rsbuild.build();
  const read = (ext: string) =>
    fs.readFileSync(path.join(distPath, `performance-budget.${ext}`), 'utf-8');
  return {
    report: JSON.parse(read('json')) as PerformanceReport,
    markdown: read('md'),
  };
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

describe('parseSize', () => {
  it('reads byte counts and kB / MB strings', () => {
    expect(parseSize(1200)).toBe(1200);
    expect(parseSize('800kB')).toBe(800000);
    expect(parseSize('1.5 MB')).toBe(1500000);
    expect(() => parseSize('big')).toThrow('invalid size "big"');
  });
});

describe('pluginPerformanceBudget', () => {
  it('reports initial size and requests, async chunks and the import depth of critical chunks', async () => {
    const { report } = await build({
      budgets: {},
      criticalChunks: ['shell', 'editor', 'missing'],
    });
    const entry = report.entries.index;
    expect(entry.initialRequests).toBe(2);
    expect(entry.initialJs).toBeGreaterThan(0);
    expect(entry.initialCss).toBeGreaterThan(0);
    expect(entry.criticalPath).toEqual({ shell: 1, editor: 2, missing: null });
    expect(report.asyncChunks).toBe(2);
    expect(report.duplicatePackages).toEqual([]);
  });

  it('fails the build when a budget is exceeded', async () => {
    await expect(
      build({
        budgets: { initialRequests: 1, criticalPathDepth: 1 },
        criticalChunks: ['editor'],
      }),
    ).rejects.toThrow(
      /2 budget\(s\) exceeded:\n {2}initialRequests \(index\): 2 > 1\n {2}criticalPathDepth \(index\): 2 > 1/,
    );
  });

  it('only warns with level: warn and still writes the report', async () => {
    const { markdown } = await build({
      budgets: { asyncChunks: 1 },
      level: 'warn',
    });
    expect(markdown).toContain('| Async chunks | all | 2 | 1 | ❌ |');
  });
});

describe('formatReportMarkdown', () => {
  it('shows the change against a baseline report', () => {
    const report: PerformanceReport = {
      compression: 'gzip',
      entries: {
        main: {
          initialJs: 120000,
          initialCss: 10000,
          initialRequests: 4,
          criticalPath: { editor: 2 },
        },
      },
      asyncChunks: 30,
      duplicatePackages: [{ name: 'router', versions: ['6.30.0', '7.1.0'] }],
    };
    const baseline: PerformanceReport = {
      ...report,
      entries: {
        main: {
          ...report.entries.main,
          initialJs: 100000,
          criticalPath: { editor: 3 },
        },
      },
      asyncChunks: 30,
      duplicatePackages: [],
    };
    const budgets = { initialJs: '110kB', duplicatePackages: 0 };
    const markdown = formatReportMarkdown(
      report,
      budgets,
      checkBudgets(report, budgets),
      baseline,
    );
    expect(markdown).toContain(
      '| Initial JS | main | 120.0 kB (+20.0 kB) | 110.0 kB | ❌ |',
    );
    expect(markdown).toContain(
      '| Critical path depth: `editor` | main | 2 (-1) | - | ✅ |',
    );
    expect(markdown).toContain(
      '| Async chunks | all | 30 (no change) | - | ✅ |',
    );
    expect(markdown).toContain(
      '| Duplicate packages | all | 1 (+1) | 0 | ❌ |',
    );
    expect(markdown).toContain('- `router`: 6.30.0, 7.1.0');
  });
});
