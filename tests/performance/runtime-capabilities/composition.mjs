import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const [dir] = process.argv.slice(2);
const files = [];
async function list(d, prefix = '') {
  for (const entry of await readdir(d, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'dist-v2'
    )
      continue;
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) await list(path.join(d, entry.name), relative);
    else if (entry.isFile()) files.push(relative);
  }
}
await list(dir);
const result = {};
for (const file of files.filter(
  x => /stats-.*\.json$/.test(x) && !x.includes('node_modules'),
)) {
  const stats = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
  const groups = {};
  const modules = [];
  const seen = new Set();
  const walk = items => {
    for (const item of items || []) {
      if (item.modules) {
        walk(item.modules);
        continue;
      }
      if (!item.name) continue;
      if (seen.has(item.identifier || item.name)) continue;
      seen.add(item.identifier || item.name);
      const name = item.name.replaceAll('\\', '/');
      let group = name.includes('/packages/runtime/plugin-runtime/')
        ? '@modern-js/runtime'
        : name.includes('/packages/toolkit/plugin/')
          ? '@modern-js/plugin'
          : name.includes('/packages/')
            ? name.match(/\/packages\/([^/]+\/[^/]+)/)?.[1]
            : name.match(
                /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/,
              )?.[1] || 'application';
      group ||= 'unknown';
      groups[group] ||= { modules: 0, sourceBytes: 0 };
      groups[group].modules++;
      groups[group].sourceBytes += item.size || 0;
      modules.push({ name, size: item.size });
    }
  };
  walk(stats.modules.filter(m => !m.orphan));
  result[file] = {
    groups: Object.fromEntries(
      Object.entries(groups).sort(
        (a, b) => b[1].sourceBytes - a[1].sourceBytes,
      ),
    ),
    bridgeRecovery: modules.filter(x =>
      /application\/(?:index|browser|data|snapshot|ApplicationShell|constants)|bridge-react.*ssr|__MF_BRIDGE_SSR__|mf\/ssr/.test(
        x.name,
      ),
    ),
    nodeBuiltins: modules.filter(x =>
      /external.*(?:node:|"stream"|"fs"|"path")/.test(x.name),
    ),
    modules,
  };
}
await writeFile(
  path.join(dir, 'composition.json'),
  JSON.stringify(result, null, 2),
);
console.log(path.join(dir, 'composition.json'));
