import {
  commentDefaultExport,
  commentNamedExport,
  rewriteExports,
} from '../../src/utils/rewriteExports';
import { ignoreKeys } from '../../src/utils/parseExports';

describe('rewriteExports', () => {
  it('should patch default null if missing', async done => {
    const input = `
const a = 1;
`;
    const actual = await rewriteExports(input);
    expect(actual).toContain('export default null');
    expect(actual).toContain(commentDefaultExport);
    done();
  });

  it('should not patch default when reexport default from other module', async done => {
    const input = `
export { default } from 'other';
`;
    const actual = await rewriteExports(input);
    expect(actual).toEqual(input);
    done();
  });

  it('should patch default with all scope variables', async done => {
    const input = `
export const a = 1;
export const b = () => {};
export function c() {};
`;
    const actual = await rewriteExports(input);
    expect(actual).toMatchInlineSnapshot(`
      "
      export const a = 1;
      export const b = () => {};
      export function c() {};

      // ESMPACK PATCH DEFAULT EXPORT
      export default {
      a,
      b,
      c
      }
      "
    `);
    done();
  });

  it('should export default with reexport other module', async done => {
    const input = `
export { a } from 'a';
export { a as b } from 'b';
export const c = 1;
`;

    const actual = await rewriteExports(input);
    // FIXME: should take reexport into account, but ignore for now
    expect(actual).toMatchInlineSnapshot(`
      "
      export { a } from 'a';
      export { a as b } from 'b';
      export const c = 1;

      // ESMPACK PATCH DEFAULT EXPORT
      export default {
      c
      }
      "
    `);
    done();
  });

  it('should patch named exports from default', async done => {
    const input = `
function withSize() {}
withSize.SizeMe = SizeMe;
withSize.withSize = withSize;

var reactSizeme = withSize;

export default reactSizeme;
`;

    const actual = await rewriteExports(input);
    expect(actual).toMatchInlineSnapshot(`
      "
      function withSize() {}
      withSize.SizeMe = SizeMe;
      withSize.withSize = withSize;

      var reactSizeme = withSize;

      export default reactSizeme;

      // ESMPACK PATCH NAMED EXPORTS
      export {
        withSize
      }

      // ESMPACK PATCH NAMED EXPORTS
      export const SizeMe = reactSizeme.SizeMe;
      "
    `);
    done();
  });

  it('should patch named exports from default with object assignemnt', async done => {
    // objectProperty, objectMethod, spread
    const input = `
var other = {
  a: 'a',
};
var lib = {
  name: 'lib',
  parse() {},
  ...other,
};

export default lib;
`;

    const actual = await rewriteExports(input);
    expect(actual).toMatchInlineSnapshot(`
      "
      var other = {
        a: 'a',
      };
      var lib = {
        name: 'lib',
        parse() {},
        ...other,
      };

      export default lib;

      // ESMPACK PATCH NAMED EXPORTS
      export const name = lib.name;
      export const parse = lib.parse;
      export const a = lib.a;
      "
    `);
    done();
  });

  it('should not patch conflict named exports', async done => {
    const input = `
const a = {};
a.foo = 'foo';

const b = a;
b.bar = 'bar';

export default a;

const _foo = 'f';
export { _foo as foo };

export const bar = 'bar';
`;

    const actual = await rewriteExports(input);
    expect(actual).not.toContain(commentNamedExport);
    done();
  });

  it(`should patch named export from default, but ignore ${ignoreKeys.join(
    ', ',
  )}`, async done => {
    const input = `
const o = {};
const a = {};
${ignoreKeys.map(k => `a.${k} = ${JSON.stringify(k)};`).join('\n')}
a.__name__ = 'name';
export default a;
`;

    const actual = await rewriteExports(input);
    for (const key of ignoreKeys) {
      expect(actual).not.toContain(`export const ${key} =`);
    }
    expect(actual).toContain('export const __name__ = a.__name__');
    done();
  });

  it('should patch named export from default, but ignore reexport conflict name', async done => {
    const input = `
export { s as foo } from 'other';
const a = {};
a.foo = 'foo';
export default a;
`;

    const actual = await rewriteExports(input);
    expect(actual).toMatchInlineSnapshot(`
      "
      export { s as foo } from 'other';
      const a = {};
      a.foo = 'foo';
      export default a;
      "
    `);
    done();
  });

  it('should patch named export from default, and export conflict local definition', async done => {
    const input = `
const Item = () => {};
const Component = () => {};
Component.Item = Item;

export default Component;
`;

    const actual = await rewriteExports(input);
    expect(actual).toMatchInlineSnapshot(`
      "
      const Item = () => {};
      const Component = () => {};
      Component.Item = Item;

      export default Component;

      // ESMPACK PATCH NAMED EXPORTS
      export {
        Item
      }
      "
    `);
    done();
  });

  it('should only see module scope as conflict', async done => {
    const input = `
function a() {
  const Item = () => {};
}
const Component = () => {};
Component.Item = Item;

export default Component;
`;

    const actual = await rewriteExports(input);
    expect(actual).toMatchInlineSnapshot(`
      "
      function a() {
        const Item = () => {};
      }
      const Component = () => {};
      Component.Item = Item;

      export default Component;

      // ESMPACK PATCH NAMED EXPORTS
      export const Item = Component.Item;
      "
    `);
    done();
  });

  it('should not duplicate export', async done => {
    const input = `
var react = {};
var Children = react.Children;
export default react;
export { Children };
`;

    const actual = await rewriteExports(input);
    expect(actual).toEqual(input);
    done();
  });
});
