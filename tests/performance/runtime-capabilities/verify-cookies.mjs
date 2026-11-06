import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';

const [base, head] = process.argv.slice(2);
const from = repo =>
  createRequire(
    path.join(repo, 'packages/runtime/plugin-runtime/package.json'),
  );
const reference = from(base)('cookie').parse;
const { parseBrowserCookies } = from(head)('./dist/cjs/core/browser/data.js');
const cases = [
  '',
  'a=b',
  'a=first; a=last',
  'a="foo"',
  'a="foo',
  'a="',
  'a=%22foo%22',
  '__proto__=x;constructor=y;toString=z;hasOwnProperty=w',
  'a=%ZZ',
  'a=%E0%A4%A',
  'a=foo+bar',
  '  a\t=\t b  ',
  'foo; bar=baz',
  '=v',
  'a=b=c',
  'a=;',
  'a=\u00a0b\u00a0',
];
let seed = 8437882;
const next = n => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % n;
};
const alphabet = 'abcABC123;=\t %"+_\n\r\u00a0\u4e2d';
for (let i = 0; i < 100000; i++) {
  let s = '';
  for (let j = next(120); j > 0; j--) s += alphabet[next(alphabet.length)];
  cases.push(s);
}
for (const value of cases)
  if (!isDeepStrictEqual(reference(value), parseBrowserCookies(value)))
    throw Error(
      JSON.stringify({
        value,
        old: reference(value),
        new: parseBrowserCookies(value),
      }),
    );
console.log(
  JSON.stringify({ cases: cases.length, seed: 8437882, matching: true }),
);
