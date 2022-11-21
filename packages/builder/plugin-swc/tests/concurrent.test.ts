import { assert, describe, it } from 'vitest';
import { Compiler } from '../src/binding';

describe('concurrent compile', async () => {
  it('transform and transformSync', async () => {
    const COUNT = 1;
    const exampleA = new Array(COUNT)
      .fill('')
      .map((_, i) => `import {Foo${i}} from "fooA";console.log(Foo${i})`)
      .join('\n');
    const expectedA = new Array(COUNT)
      .fill('')
      .map((_, i) => `import Foo${i} from "fooA/foo${i}";`)
      .join('\n');
    const exampleB = new Array(COUNT)
      .fill('')
      .map((_, i) => `import {Foo${i}} from "fooB";console.log(Foo${i})`)
      .join('\n');
    const expectedB = new Array(COUNT)
      .fill('')
      .map((_, i) => `import Foo${i} from "fooB/foo${i}";`)
      .join('\n');
    const exampleC = new Array(COUNT)
      .fill('')
      .map((_, i) => `import {Foo${i}} from "fooC";console.log(Foo${i})`)
      .join('\n');
    const expectedC = new Array(COUNT)
      .fill('')
      .map((_, i) => `import Foo${i} from "fooC/foo${i}";`)
      .join('\n');

    const compiler = new Compiler({
      module: {
        type: 'es6',
      },
      extensions: {
        pluginImport: [
          {
            fromSource: 'fooA',
            replaceJs: {
              replaceExpr(member: string) {
                return `fooA/${member}`;
              },
            },
            replaceCss: {},
          },
          {
            fromSource: 'fooB',
            replaceJs: {
              replaceExpr(member: string) {
                return `fooB/${member}`;
              },
            },
            replaceCss: {},
          },
          {
            fromSource: 'fooC',
            replaceJs: {
              replaceExpr(member: string) {
                return `fooC/${member}`;
              },
            },
            replaceCss: {},
          },
        ],
      },
    });

    const [{ code: resA }, { code: resB }, { code: resC }] = await Promise.all([
      compiler.transform('', exampleA),
      compiler.transform('', exampleB),
      compiler.transformSync('', exampleC),
    ]);

    assert(resA.includes(expectedA));
    assert(resB.includes(expectedB));
    assert(resC.includes(expectedC));
    assert(exampleA);
  });
});
