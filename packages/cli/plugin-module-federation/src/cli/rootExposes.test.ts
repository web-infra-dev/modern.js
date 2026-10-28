import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { rs } from '@rstest/core';
import { markRootExposes } from './rootExposes';

it('marks only Modern root candidates and leaves the caller config and ordinary exposes intact', () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'modern-root-exposes-'),
  );
  try {
    fs.writeFileSync(
      path.join(directory, 'app.tsx'),
      "import { createRoot } from '@modern-js/runtime/react'",
    );
    fs.writeFileSync(
      path.join(directory, 'card.tsx'),
      'export default () => null',
    );
    const input = {
      './App': './app.tsx',
      './Card': './card.tsx',
      './Named': { import: './app.tsx', name: 'named' },
    };
    const result = markRootExposes(input, directory);
    expect(result).toEqual({
      './App': './app.tsx?modern-mf-root',
      './Card': './card.tsx',
      './Named': { import: './app.tsx?modern-mf-root', name: 'named' },
    });
    expect(input['./App']).toBe('./app.tsx');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

it('does no filesystem work for empty exposes or requests with an existing query', () => {
  const stat = rs.spyOn(fs, 'statSync');
  const read = rs.spyOn(fs, 'readFileSync');
  try {
    expect(markRootExposes(undefined, '/unused')).toBeUndefined();
    expect(markRootExposes({}, '/unused')).toEqual({});
    expect(
      markRootExposes({ './App': './app.tsx?existing' }, '/unused'),
    ).toEqual({ './App': './app.tsx?existing' });
    expect(stat).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  } finally {
    stat.mockRestore();
    read.mockRestore();
  }
});

it('keeps discovery of 1,000 real expose files within its startup budget', () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'modern-root-exposes-performance-'),
  );
  // About 32 MiB in total, including large ordinary component exposes. Setup
  // and assertions are outside the timer. No filesystem calls are mocked.
  const padding = Array.from(
    { length: 600 },
    (_, index) =>
      `const field${index} = {label: 'weather-${index}', value: ${index}};`,
  ).join('\n');
  const input: Record<string, string> = {};
  const expected: Record<string, string> = {};
  try {
    for (let index = 0; index < 1_000; index++) {
      const modern = index % 10 === 0;
      const request = `./expose-${index}${index % 2 ? '.tsx' : ''}`;
      fs.writeFileSync(
        path.join(directory, `expose-${index}.tsx`),
        `${modern ? "import { createRoot } from '@modern-js/runtime/react';" : 'export default () => null;'}\n${padding}`,
      );
      input[`./Expose${index}`] = request;
      expected[`./Expose${index}`] = modern
        ? `${request}?modern-mf-root`
        : request;
    }
    fs.writeFileSync(path.join(directory, 'not-exposed.tsx'), padding);

    // Count real reads separately so spy bookkeeping does not affect timing.
    const read = rs.spyOn(fs, 'readFileSync');
    try {
      expect(markRootExposes(input, directory)).toEqual(expected);
      expect(read).toHaveBeenCalledTimes(1_000);
    } finally {
      read.mockRestore();
    }

    markRootExposes(input, directory);
    const times = Array.from({ length: 5 }, () => {
      const start = performance.now();
      markRootExposes(input, directory);
      return performance.now() - start;
    }).sort((a, b) => a - b);
    const median = times[2];
    // A coarse CI guard against large regressions, not a single-run latency
    // guarantee. The median tolerates individual scheduler/GC interruptions.
    const budgetMs = 1_000;
    console.info(
      `[route-scope performance] markRootExposes: 1,000 files, median ${median.toFixed(1)}ms, budget ${budgetMs}ms`,
    );
    expect(median).toBeLessThan(budgetMs);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
