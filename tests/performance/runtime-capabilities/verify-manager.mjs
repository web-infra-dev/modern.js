import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Compare registration order and errors against the fixed pre-change manager.
const [repo, ref = '93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa'] =
  process.argv.slice(2);
const source = 'packages/toolkit/plugin/src/manager.ts';
const temporary = await mkdtemp(path.join(tmpdir(), 'modern-manager-'));
try {
  const original = path.join(temporary, 'reference.mts');
  await writeFile(
    original,
    execFileSync('git', ['show', `${ref}:${source}`], { cwd: repo }),
  );
  const before = (await import(pathToFileURL(original))).createPluginManager;
  const after = (await import(pathToFileURL(path.join(repo, source))))
    .createPluginManager;
  let seed = 729193;
  const random = n => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  let errors = 0;
  for (let trial = 0; trial < 10000; trial++) {
    const plugins = Array.from({ length: 2 + random(18) }, (_, i) => ({
      name: 'p' + i,
      pre: [],
      post: [],
      usePlugins: [],
    }));
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      if (i) {
        plugin.pre.push(plugins[random(i)].name);
        if (random(2)) plugin.usePlugins.push(plugins[random(i)]);
      }
      if (i + 1 < plugins.length && random(2))
        plugin.post.push(plugins[i + 1 + random(plugins.length - i - 1)].name);
    }
    if (trial % 2) plugins[0].pre.push(plugins.at(-1).name);
    const evaluate = create => {
      const manager = create();
      try {
        for (const plugin of plugins.toReversed())
          if (!manager.isPluginExists(plugin.name))
            manager.addPlugins([plugin]);
        return JSON.stringify(manager.getPlugins().map(plugin => plugin.name));
      } catch (error) {
        return String(error);
      }
    };
    const expected = evaluate(before),
      actual = evaluate(after);
    if (expected !== actual)
      throw Error(`Graph ${trial}: ${expected} / ${actual}`);
    if (expected.startsWith('Error')) errors++;
  }
  console.log(
    JSON.stringify({
      graphs: 10000,
      matchingErrorOutcomes: errors,
      seed: 729193,
      ref,
    }),
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
