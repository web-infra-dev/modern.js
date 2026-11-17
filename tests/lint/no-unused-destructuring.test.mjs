import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { withLintFixture } from './fixture.mjs';

const rule = 'modern/no-unused-destructuring';
const parseDiagnostics = stdout =>
  stdout.trim()
    ? stdout
        .trim()
        .split('\n')
        .map(line => JSON.parse(line))
    : [];

test('rejects unused underscore destructuring through the registered CLI rule', async () => {
  const invalid = {
    'local.ts': `export function local(props: { matches: unknown; loaderData: string }) {
      const { matches: _unusedLocal, loaderData } = props;
      return loaderData;
    }`,
    'parameter.tsx': `export function Page({ matches: _unusedArgument, loaderData }: { matches: unknown; loaderData: string }) {
      return <div>{loaderData}</div>;
    }`,
    'javascript.js': `export function read(props) {
      const { matches: _unusedJavaScript, loaderData } = props;
      return loaderData;
    }`,
    'shorthand.ts': `export function shorthand(props: { _shorthand: string }) {
      const { _shorthand } = props;
      return 0;
    }`,
    'default.ts': `export function defaults(props: { value?: string }) {
      const { value: _unusedDefault = String(1) } = props;
      return 0;
    }`,
    'nested.ts': `export function nested(props: { child: { value: string }; used: string }) {
      const { child: { value: _unusedNested }, used } = props;
      return used;
    }`,
    'write-only.ts': `export function writes(props: { value: number }) {
      let { value: _writeOnly } = props;
      _writeOnly = 2;
      return 0;
    }`,
    'shadow.ts': `export function shadow(props: { value: string }) {
      const { value: _shadowed } = props;
      function read(_shadowed: string) { return _shadowed; }
      return read('used');
    }`,
    'unused-rest.ts': `export function unusedRest(props: { value: string; used: string }) {
      const { value: _unusedSibling, ..._unusedRest } = props;
      return 0;
    }`,
    'nested-outer-rest.ts': `export function nestedRest(props: { child: { value: string }; used: string }) {
      const { child: { value: _unusedInsideExcludedChild }, ...rest } = props;
      return rest;
    }`,
    'earlier-parameter.ts': `export function earlier({ value: _earlier }: { value: string }, used: string) {
      return used;
    }`,
  };
  const names = [
    '_unusedLocal',
    '_unusedArgument',
    '_unusedJavaScript',
    '_shorthand',
    '_unusedDefault',
    '_unusedNested',
    '_writeOnly',
    '_shadowed',
    '_unusedSibling',
    '_unusedRest',
    '_unusedInsideExcludedChild',
    '_earlier',
  ];

  await withLintFixture(async ({ src, lint }) => {
    await Promise.all(
      Object.entries(invalid).map(([name, code]) =>
        writeFile(join(src, name), code),
      ),
    );
    const result = await lint(
      Object.keys(invalid).map(name => `packages/fixture/src/${name}`),
    );
    assert.equal(
      result.code,
      1,
      'unused underscore destructuring must fail lint',
    );
    const diagnostics = parseDiagnostics(result.stdout);
    assert.equal(diagnostics.length, names.length, result.stdout);
    for (const name of names) {
      const diagnostic = diagnostics.find(entry =>
        entry.message.includes(`'${name}'`),
      );
      assert.equal(
        diagnostic?.ruleName,
        rule,
        `missing rule diagnostic for ${name}: ${result.stdout}`,
      );
      assert.match(diagnostic.message, /Remove the unused destructuring/);
    }
  });
});

test('preserves reads, real rest exclusions and whole parameter placeholders', async () => {
  const valid = {
    'reads.ts': `export function reads(props: { value: string }) {
      const { value: _read } = props;
      return _read;
    }`,
    'closure.ts': `export function closure(props: { value: string }) {
      const { value: _captured } = props;
      return () => _captured;
    }`,
    'defaults.ts': `export function defaults(props: { value?: string }) {
      const { value: _default = 'fallback' } = props;
      return _default;
    }`,
    'rest.ts': `export function omit(props: { secret: string; used: string }) {
      const { secret: _secret, ...safe } = props;
      return safe;
    }`,
    'nested-rest.ts': `export function nested(props: { child: { secret: string; used: string } }) {
      const { child: { secret: _secret, ...safe } } = props;
      return safe;
    }`,
    'rest-parameter.ts': `export function omit({ secret: _secret, ...safe }: { secret: string; used: string }) {
      return safe;
    }`,
    'placeholder.ts': `export const loader = (_args: { request: Request }) => null;`,
    'type-assertion.ts': `type Assert<T extends true> = T;
      type _Check = Assert<true>;
      export {};`,
    'array.ts': `export function array(values: string[]) {
      const [_first, second] = values;
      return second;
    }`,
    'jsx.tsx': `export function App(props: { Widget: () => unknown }) {
      const { Widget: _Widget } = props;
      return <_Widget />;
    }`,
    'type-read.ts': `export function typeRead(props: { value: string }) {
      const { value: _value } = props;
      const result: typeof _value = 'used';
      return result;
    }`,
    'assignment.ts': `export function assignment(props: { _assigned: number }) {
      let _assigned = 0;
      ({ _assigned } = props);
      return 0;
    }`,
    'exported.ts': `const props = { value: 1 };
      export const { value: _exported } = props;`,
    'exported-rest.ts': `const props = { secret: 'private', value: 1 };
      export const { secret: _secret, ..._public } = props;`,
    'declaration.d.ts': `export declare function declared({ value: _value }: { value: string }): string;`,
    'function-type.ts': `export type Read = ({ value: _value }: { value: string }) => string;`,
  };

  await withLintFixture(async ({ src, lint }) => {
    await Promise.all(
      Object.entries(valid).map(([name, code]) =>
        writeFile(join(src, name), code),
      ),
    );
    const result = await lint(
      Object.keys(valid).map(name => `packages/fixture/src/${name}`),
    );
    assert.equal(result.code, 0, result.stdout);
    assert.equal(result.stdout, '');

    await writeFile(
      join(src, 'ordinary.ts'),
      `export function ordinary(props: { value: number }) {
        const { value } = props;
        return 0;
      }`,
    );
    const ordinary = await lint(['packages/fixture/src/ordinary.ts']);
    const diagnostics = parseDiagnostics(ordinary.stdout);
    assert.equal(ordinary.code, 1);
    assert.equal(diagnostics.length, 1, ordinary.stdout);
    assert.equal(diagnostics[0].ruleName, '@typescript-eslint/no-unused-vars');
  });
});
