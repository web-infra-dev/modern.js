#!/usr/bin/env node
// Usage: node analyze.mjs <resource-stages.json> <records.json>
// records.json: a report object or an array of reports from window.__MODERN_RS__.report()
import { readFileSync } from 'node:fs';

const [stagesFile, recordsFile] = process.argv.slice(2);
if (!stagesFile || !recordsFile) {
  console.error(
    'Usage: node analyze.mjs <resource-stages.json> <records.json>',
  );
  process.exit(1);
}
const stages = JSON.parse(readFileSync(stagesFile, 'utf-8'));
const raw = JSON.parse(readFileSync(recordsFile, 'utf-8'));
const reports = Array.isArray(raw) ? raw : [raw];

const median = values => {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const declared = new Set();
const rows = stages.declarations.map(declaration => {
  const ids = declaration.chunks.map(chunk => String(chunk.id));
  ids.forEach(id => declared.add(id));
  let prefetched = 0;
  let used = 0;
  let late = 0;
  const leads = [];
  for (const report of reports) {
    for (const record of report.records ?? []) {
      if (!ids.includes(String(record.chunkId))) continue;
      if (record.prefetchStart !== undefined) prefetched++;
      if (record.requested === undefined) continue;
      used++;
      if (
        record.prefetchEnd === undefined ||
        record.prefetchEnd > record.requested
      ) {
        late++;
      }
      if (record.prefetchEnd !== undefined) {
        leads.push(record.requested - record.prefetchEnd);
      }
    }
  }
  return {
    declaration: `${declaration.file}:${declaration.line} ${declaration.request}`,
    stage: declaration.stage,
    kB:
      Math.round(declaration.chunks.reduce((s, c) => s + c.size, 0) / 102.4) /
      10,
    hitRate: prefetched
      ? `${Math.round((Math.min(used, prefetched) / prefetched) * 100)}%`
      : '-',
    lateRate: used ? `${Math.round((late / used) * 100)}%` : '-',
    medianLeadMs: median(leads) ?? '-',
  };
});
console.log('Declarations');
console.table(rows);

const undeclared = new Map();
for (const report of reports) {
  const interactive = report.stages?.interactive ?? Number.POSITIVE_INFINITY;
  for (const record of report.records ?? []) {
    const id = String(record.chunkId);
    if (declared.has(id) || record.requested === undefined) continue;
    if (record.requested < interactive) {
      undeclared.set(id, (undeclared.get(id) ?? 0) + 1);
    }
  }
}
console.log('Requested before interactive without a declaration');
console.table([...undeclared].map(([chunkId, times]) => ({ chunkId, times })));

console.log('Stage statistics');
console.table(
  stages.targets.flatMap(target =>
    Object.entries(target.stats).map(([stage, stats]) => ({
      target: `${target.kind}:${target.name}`,
      stage,
      kB: Math.round(stats.bytes / 102.4) / 10,
      requests: stats.requests,
      depth: stats.depth,
      estimatedMs: stats.time,
    })),
  ),
);
