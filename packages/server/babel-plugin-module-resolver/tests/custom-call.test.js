import path from 'path';
import { transform } from '@babel/core';
import plugin from '../src';

const calls = ['customMethod.something'];

let originalCwd = process.cwd();
beforeAll(() => {
  originalCwd = process.cwd();
  process.chdir(path.resolve(__dirname, '../'));
});

afterAll(() => {
  process.chdir(originalCwd);
});

describe('custom calls', () => {
  const transformerOpts = {
    babelrc: false,
    plugins: [
      [
        plugin,
        {
          root: './tests/testproject/src',
          alias: {
            test: './tests/testproject/test',
          },
          transformFunctions: ['customMethod.something'],
        },
      ],
    ],
  };

  calls.forEach(name => {
    describe(name, () => {
      it('should resolve the path based on the root config', () => {
        const code = `${name}("components/Header/SubHeader", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(
          `${name}("./tests/testproject/src/components/Header/SubHeader", ...args);`,
        );
      });

      it('should alias the path', () => {
        const code = `${name}("test", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(
          `${name}("./tests/testproject/test", ...args);`,
        );
      });

      it('should not change a relative path', () => {
        const code = `${name}("./utils", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}("./utils", ...args);`);
      });

      it('should handle no arguments', () => {
        const code = `${name}();`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}();`);
      });

      it('should handle the first argument not being a string literal', () => {
        const code = `${name}(path, ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}(path, ...args);`);
      });

      it('should handle an empty path', () => {
        const code = `${name}('', ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}('', ...args);`);
      });

      it('should ignore the call if the method name is not fully matched (suffix)', () => {
        const code = `${name}.after("components/Sidebar/Footer", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(
          `${name}.after("components/Sidebar/Footer", ...args);`,
        );
      });

      it('should ignore the call if the method name is not fully matched (prefix)', () => {
        const code = `before.${name}("components/Sidebar/Footer", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(
          `before.${name}("components/Sidebar/Footer", ...args);`,
        );
      });
    });
  });
});
