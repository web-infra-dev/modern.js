import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url)),
);
assert.equal(pkg.engines.node, '>=20');
assert.equal(pkg.dependencies.cookie, undefined);
assert.equal(pkg.dependencies['cookie-es'], undefined);
for (const [format, extension] of [
  ['esm', 'mjs'],
  ['esm-node', 'mjs'],
  ['cjs', 'js'],
]) {
  const code = await readFile(
    new URL(
      `../dist/${format}/core/browser/cookies.${extension}`,
      import.meta.url,
    ),
    'utf8',
  );
  assert(
    !/(?:from\s*|require\()\s*['"]cookie['"]/.test(code),
    `${format} left cookie external`,
  );
  assert(
    !/function (?:stringify|serialize|parseSetCookie)/.test(code),
    `${format} retained serialization`,
  );
  assert(
    code.includes('Includes cookie@2.0.2 (MIT)'),
    `${format} missing attribution`,
  );
}
assert(
  (
    await readFile(
      new URL('../dist/licenses/cookie.txt', import.meta.url),
      'utf8',
    )
  ).includes('MIT License'),
);
console.log(
  'Cookie ESM/CJS artifacts are self-contained, parse-only and attributed. Node >=20 is preserved.',
);
