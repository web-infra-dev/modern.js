import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { logger, type RsbuildPlugin, type Rspack } from '@rsbuild/core';
import { findDuplicatePackages } from './duplicatePackages';

/** Size budget: bytes, or a string such as `'800kB'` / `'1.5MB'` (1 kB = 1000 bytes). */
export type SizeBudget = number | string;

export interface PerformanceBudgets {
  /** Compressed size of the JS loaded before the entry runs, per HTML entry. */
  initialJs?: SizeBudget;
  /** Compressed size of the CSS loaded before the entry runs, per HTML entry. */
  initialCss?: SizeBudget;
  /** Number of JS and CSS files loaded before the entry runs, per HTML entry. */
  initialRequests?: number;
  /** Number of async JS chunks in the whole build. */
  asyncChunks?: number;
  /** Packages bundled in more than one version in the initial chunks. */
  duplicatePackages?: number;
  /**
   * Dynamic import levels between the entry and each chunk group listed in
   * `criticalChunks`: 1 means the entry imports it directly. Every level is one more
   * round trip before that code can run.
   */
  criticalPathDepth?: number;
}

export interface PerformanceBudgetOptions {
  budgets: PerformanceBudgets;
  /** Async chunk group names (`webpackChunkName`) that the first screen needs. */
  criticalChunks?: (string | RegExp)[];
  /** Only check these HTML entries. Defaults to every entry. */
  entries?: string[];
  /** How sizes are measured. @default 'gzip' */
  compression?: 'gzip' | 'brotli' | 'none';
  /**
   * `error` fails the production build when a budget is exceeded, `warn` only prints.
   * @default 'error'
   */
  level?: 'warn' | 'error';
  /**
   * Where to write the report, relative to the output directory. A `.json` report and a
   * `.md` summary (ready to post as a pull request comment) are written.
   * @default 'performance-budget'
   */
  reportFile?: string | false;
  /**
   * A report from an earlier build (for example the target branch). The summary then
   * shows the change for every metric.
   */
  baseline?: string;
}

export interface EntryMetrics {
  initialJs: number;
  initialCss: number;
  initialRequests: number;
  /** Chunk group name -> import depth from the entry (null when not reachable). */
  criticalPath: Record<string, number | null>;
}

export interface PerformanceReport {
  compression: 'gzip' | 'brotli' | 'none';
  entries: Record<string, EntryMetrics>;
  asyncChunks: number;
  duplicatePackages: { name: string; versions: string[] }[];
  /** Time spent collecting this report, in milliseconds. */
  durationMs?: number;
}

export interface BudgetViolation {
  metric: keyof PerformanceBudgets;
  entry?: string;
  actual: number;
  budget: number;
}

const UNITS: Record<string, number> = {
  b: 1,
  kb: 1000,
  k: 1000,
  mb: 1000 * 1000,
  m: 1000 * 1000,
};

export const parseSize = (value: SizeBudget): number => {
  if (typeof value === 'number') {
    return value;
  }
  const match = /^\s*([\d.]+)\s*([a-z]*)\s*$/i.exec(value);
  const unit = match ? UNITS[(match[2] || 'b').toLowerCase()] : undefined;
  if (!match || unit === undefined) {
    throw new Error(`[performance-budget] invalid size "${value}"`);
  }
  return Math.round(Number(match[1]) * unit);
};

const compressedSize = (
  source: Buffer,
  compression: PerformanceReport['compression'],
): number => {
  if (compression === 'none') {
    return source.length;
  }
  if (compression === 'brotli') {
    return zlib.brotliCompressSync(source, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
  }
  return zlib.gzipSync(source, { level: 9 }).length;
};

const matches = (name: string, patterns: (string | RegExp)[]): boolean =>
  patterns.some(pattern =>
    typeof pattern === 'string' ? pattern === name : pattern.test(name),
  );

/** Shortest dynamic-import depth from the entrypoint to each named chunk group. */
const criticalPathDepths = (
  entrypoint: Rspack.ChunkGroup,
  patterns: (string | RegExp)[],
): Record<string, number | null> => {
  const result: Record<string, number | null> = {};
  if (patterns.length === 0) {
    return result;
  }
  const depth = new Map<Rspack.ChunkGroup, number>([[entrypoint, 0]]);
  const queue: Rspack.ChunkGroup[] = [entrypoint];
  while (queue.length > 0) {
    const group = queue.shift() as Rspack.ChunkGroup;
    const level = depth.get(group) as number;
    for (const child of group.childrenIterable) {
      if (!depth.has(child)) {
        depth.set(child, level + 1);
        queue.push(child);
      }
    }
  }
  for (const [group, level] of depth) {
    if (group !== entrypoint && group.name && matches(group.name, patterns)) {
      const known = result[group.name];
      result[group.name] =
        known === undefined || known === null ? level : Math.min(known, level);
    }
  }
  for (const pattern of patterns) {
    if (typeof pattern === 'string' && !(pattern in result)) {
      result[pattern] = null;
    }
  }
  return result;
};

export const collectPerformanceReport = (
  compilation: Rspack.Compilation,
  options: Pick<
    PerformanceBudgetOptions,
    'compression' | 'criticalChunks' | 'entries'
  >,
  entryNames: string[],
): PerformanceReport => {
  const compression = options.compression ?? 'gzip';
  const sizes = new Map<string, number>();
  const sizeOf = (file: string): number => {
    let size = sizes.get(file);
    if (size === undefined) {
      const asset = compilation.getAsset(file);
      size = asset ? compressedSize(asset.source.buffer(), compression) : 0;
      sizes.set(file, size);
    }
    return size;
  };

  const entries: Record<string, EntryMetrics> = {};
  for (const name of entryNames) {
    if (options.entries && !options.entries.includes(name)) {
      continue;
    }
    const entrypoint = compilation.entrypoints.get(name);
    if (!entrypoint) {
      continue;
    }
    let initialJs = 0;
    let initialCss = 0;
    let initialRequests = 0;
    const seen = new Set<string>();
    for (const chunk of entrypoint.chunks) {
      for (const file of chunk.files) {
        if (seen.has(file)) {
          continue;
        }
        seen.add(file);
        if (/\.m?js$/.test(file)) {
          initialJs += sizeOf(file);
          initialRequests += 1;
        } else if (file.endsWith('.css')) {
          initialCss += sizeOf(file);
          initialRequests += 1;
        }
      }
    }
    entries[name] = {
      initialJs,
      initialCss,
      initialRequests,
      criticalPath: criticalPathDepths(
        entrypoint,
        options.criticalChunks ?? [],
      ),
    };
  }

  let asyncChunks = 0;
  for (const chunk of compilation.chunks) {
    if (
      !chunk.canBeInitial() &&
      [...chunk.files].some(f => /\.m?js$/.test(f))
    ) {
      asyncChunks += 1;
    }
  }

  return {
    compression,
    entries,
    asyncChunks,
    duplicatePackages: findDuplicatePackages(compilation).map(item => ({
      name: item.name,
      versions: item.versions.map(version => version.version),
    })),
  };
};

export const checkBudgets = (
  report: PerformanceReport,
  budgets: PerformanceBudgets,
): BudgetViolation[] => {
  const violations: BudgetViolation[] = [];
  const check = (
    metric: keyof PerformanceBudgets,
    actual: number,
    budget: number | undefined,
    entry?: string,
  ) => {
    if (budget !== undefined && actual > budget) {
      violations.push({ metric, entry, actual, budget });
    }
  };
  for (const [entry, metrics] of Object.entries(report.entries)) {
    if (budgets.initialJs !== undefined) {
      check(
        'initialJs',
        metrics.initialJs,
        parseSize(budgets.initialJs),
        entry,
      );
    }
    if (budgets.initialCss !== undefined) {
      check(
        'initialCss',
        metrics.initialCss,
        parseSize(budgets.initialCss),
        entry,
      );
    }
    check(
      'initialRequests',
      metrics.initialRequests,
      budgets.initialRequests,
      entry,
    );
    if (budgets.criticalPathDepth !== undefined) {
      const depths = Object.values(metrics.criticalPath).filter(
        (depth): depth is number => depth !== null,
      );
      if (depths.length > 0) {
        check(
          'criticalPathDepth',
          Math.max(...depths),
          budgets.criticalPathDepth,
          entry,
        );
      }
    }
  }
  check('asyncChunks', report.asyncChunks, budgets.asyncChunks);
  check(
    'duplicatePackages',
    report.duplicatePackages.length,
    budgets.duplicatePackages,
  );
  return violations;
};

const formatBytes = (bytes: number): string =>
  bytes >= 1000 * 1000
    ? `${(bytes / 1000 / 1000).toFixed(2)} MB`
    : `${(bytes / 1000).toFixed(1)} kB`;

const formatDelta = (
  current: number,
  previous: number | undefined,
  bytes: boolean,
): string => {
  if (previous === undefined) {
    return '';
  }
  const diff = current - previous;
  if (diff === 0) {
    return ' (no change)';
  }
  const sign = diff > 0 ? '+' : '-';
  const value = bytes ? formatBytes(Math.abs(diff)) : String(Math.abs(diff));
  return ` (${sign}${value})`;
};

const formatBudget = (value: number | undefined, bytes: boolean): string => {
  if (value === undefined) {
    return '-';
  }
  return bytes ? formatBytes(value) : String(value);
};

/** Markdown summary, suitable for a pull request comment. */
export const formatReportMarkdown = (
  report: PerformanceReport,
  budgets: PerformanceBudgets,
  violations: BudgetViolation[],
  baseline?: PerformanceReport,
): string => {
  const failed = (metric: keyof PerformanceBudgets, entry?: string) =>
    violations.some(item => item.metric === metric && item.entry === entry);
  const status = (metric: keyof PerformanceBudgets, entry?: string) =>
    failed(metric, entry) ? '❌' : '✅';
  const size = (value?: SizeBudget) =>
    value === undefined ? undefined : parseSize(value);

  const lines = [
    '### Performance budget',
    '',
    `Sizes are ${report.compression === 'none' ? 'uncompressed' : `${report.compression}-compressed`}.`,
    '',
    '| Metric | Entry | Value | Budget | |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const [entry, metrics] of Object.entries(report.entries)) {
    const previous = baseline?.entries[entry];
    lines.push(
      `| Initial JS | ${entry} | ${formatBytes(metrics.initialJs)}${formatDelta(metrics.initialJs, previous?.initialJs, true)} | ${formatBudget(size(budgets.initialJs), true)} | ${status('initialJs', entry)} |`,
      `| Initial CSS | ${entry} | ${formatBytes(metrics.initialCss)}${formatDelta(metrics.initialCss, previous?.initialCss, true)} | ${formatBudget(size(budgets.initialCss), true)} | ${status('initialCss', entry)} |`,
      `| Initial requests | ${entry} | ${metrics.initialRequests}${formatDelta(metrics.initialRequests, previous?.initialRequests, false)} | ${formatBudget(budgets.initialRequests, false)} | ${status('initialRequests', entry)} |`,
    );
    for (const [group, depth] of Object.entries(metrics.criticalPath)) {
      const before = previous?.criticalPath[group];
      lines.push(
        `| Critical path depth: \`${group}\` | ${entry} | ${depth === null ? 'not reachable' : depth}${depth !== null && typeof before === 'number' ? formatDelta(depth, before, false) : ''} | ${formatBudget(budgets.criticalPathDepth, false)} | ${status('criticalPathDepth', entry)} |`,
      );
    }
  }
  lines.push(
    `| Async chunks | all | ${report.asyncChunks}${formatDelta(report.asyncChunks, baseline?.asyncChunks, false)} | ${formatBudget(budgets.asyncChunks, false)} | ${status('asyncChunks')} |`,
    `| Duplicate packages | all | ${report.duplicatePackages.length}${formatDelta(report.duplicatePackages.length, baseline?.duplicatePackages.length, false)} | ${formatBudget(budgets.duplicatePackages, false)} | ${status('duplicatePackages')} |`,
  );
  if (report.duplicatePackages.length > 0) {
    lines.push('', 'Duplicate packages in the initial chunks:', '');
    for (const item of report.duplicatePackages) {
      lines.push(`- \`${item.name}\`: ${item.versions.join(', ')}`);
    }
  }
  return `${lines.join('\n')}\n`;
};

const describeViolation = (item: BudgetViolation): string => {
  const bytes = item.metric === 'initialJs' || item.metric === 'initialCss';
  const value = (n: number) => (bytes ? formatBytes(n) : String(n));
  return `  ${item.metric}${item.entry ? ` (${item.entry})` : ''}: ${value(item.actual)} > ${value(item.budget)}`;
};

/**
 * Check first-screen size, request count, async chunk count, duplicate packages and the
 * dynamic-import depth of critical chunks against budgets after each production build,
 * and write a JSON report plus a Markdown summary for pull request comments.
 */
export const pluginPerformanceBudget = (
  options: PerformanceBudgetOptions,
): RsbuildPlugin => ({
  name: 'builder:performance-budget',

  apply: 'build',

  setup(api) {
    api.onAfterEnvironmentCompile(({ stats, environment }) => {
      if (!stats || environment.config.output.target !== 'web') {
        return;
      }
      const startedAt = Date.now();
      const report = collectPerformanceReport(
        stats.compilation,
        options,
        Object.keys(environment.entry),
      );
      report.durationMs = Date.now() - startedAt;
      const violations = checkBudgets(report, options.budgets);

      let baseline: PerformanceReport | undefined;
      if (options.baseline && fs.existsSync(options.baseline)) {
        baseline = JSON.parse(fs.readFileSync(options.baseline, 'utf-8'));
      }
      if (options.reportFile !== false) {
        const base = path.resolve(
          environment.distPath,
          options.reportFile ?? 'performance-budget',
        );
        fs.mkdirSync(path.dirname(base), { recursive: true });
        fs.writeFileSync(
          `${base}.json`,
          `${JSON.stringify(report, null, 2)}\n`,
        );
        fs.writeFileSync(
          `${base}.md`,
          formatReportMarkdown(report, options.budgets, violations, baseline),
        );
      }

      if (violations.length === 0) {
        logger.info('[performance-budget] all budgets met');
        return;
      }
      const message = `[performance-budget] ${violations.length} budget(s) exceeded:\n${violations.map(describeViolation).join('\n')}`;
      if ((options.level ?? 'error') === 'error') {
        throw new Error(message);
      }
      logger.warn(message);
    });
  },
});
