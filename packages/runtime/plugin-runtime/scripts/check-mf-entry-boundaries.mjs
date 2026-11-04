import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
async function graph(output, entry) {
  const files = new Set();
  const imports = new Set();
  async function visit(file) {
    if (files.has(file)) return;
    files.add(file);
    const text = await readFile(file, 'utf8');
    for (const [, dependency] of text.matchAll(
      /(?:from\s*|import\s*|(?:import|require)\()\s*['"]([^'"]+)['"]/g,
    )) {
      if (dependency.startsWith('.'))
        await visit(resolve(dirname(file), dependency));
      else imports.add(dependency);
    }
  }
  await visit(resolve(output, entry));
  return { files, imports };
}

for (const [format, extension] of [
  ['esm', 'mjs'],
  ['cjs', 'js'],
]) {
  const output = resolve(dist, format);
  for (const [entryName, forbiddenNames] of [
    [
      'mf.mjs',
      [
        'mf/callbacks.node.mjs',
        'mf/provider.node.mjs',
        'mf/remote.node.mjs',
        'application/server.mjs',
      ],
    ],
    [
      'mf.node.mjs',
      [
        'mf/callbacks.mjs',
        'mf/provider.mjs',
        'mf/remote.mjs',
        'mf/navigation.mjs',
        'application/index.mjs',
      ],
    ],
  ]) {
    const entry = entryName.replace(/mjs$/, extension);
    const forbidden = forbiddenNames.map(name =>
      name.replace(/mjs$/, extension),
    );
    const { files, imports } = await graph(output, entry);
    for (const name of forbidden)
      assert(
        !files.has(resolve(output, name)),
        `${entry} imported the opposite runtime: ${name}`,
      );
    if (entryName === 'mf.mjs') {
      assert(
        ![...imports].some(name =>
          /^(node:|@module-federation\/bridge-react\/(server|ssr-node)$)/.test(
            name,
          ),
        ),
        'Browser MF entry imported Node rendering',
      );
    } else {
      assert(
        !imports.has('react-dom/client'),
        'Node MF entry imported a DOM renderer',
      );
    }
    console.log(
      `${format}/${entry}: MF runtime boundary passed (${files.size} local modules)`,
    );
  }
}
