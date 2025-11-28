import path from 'path';
import { transform } from '@babel/core';
import transformToCommonJsPlugin from '@babel/plugin-transform-modules-commonjs';
import { stripIndent } from 'common-tags';
import plugin from '../src';

const cwd = path.resolve(__dirname, '../');
let originalCwd = process.cwd();
beforeAll(() => {
  originalCwd = process.cwd();
  process.chdir(cwd);
});

afterAll(() => {
  process.chdir(originalCwd);
});

describe('import and export statement', () => {
  function testImport(source, output, transformerOpts) {
    it('with an import statement', () => {
      const code = `import something from "${source}";`;
      const result = transform(code, transformerOpts);

      expect(result.code).toBe(`import something from "${output}";`);
    });

    it('with an "export from" statement', () => {
      const code = `export { something } from "${source}";`;
      const result = transform(code, transformerOpts);

      expect(result.code).toBe(`export { something } from "${output}";`);
    });

    it('with an export statement', () => {
      const code = 'let something; export { something }';
      const result = transform(code, transformerOpts);

      expect(result.code).toBe('let something;\nexport { something };');
    });
  }

  function testImportWithCommonJSTransform(source, output, transformerOpts) {
    const transformerOptsWithCommonJs = {
      babelrc: false,
      cwd,
      plugins: [
        ...transformerOpts.plugins,
        [transformToCommonJsPlugin, { noInterop: true }],
      ],
    };

    it('with a transformed require statement', () => {
      const code = `var something = require("${source}");`;
      const result = transform(code, transformerOptsWithCommonJs);

      expect(result.code).toContain(`require("${output}");`);
    });

    it('with a transformed import statement', () => {
      const code = `import something from "${source}";`;
      const result = transform(code, transformerOptsWithCommonJs);

      expect(result.code).toContain(`require("${output}");`);
    });

    it('with a transformed "export from" statement', () => {
      const code = `export { something } from "${source}";`;
      const result = transform(code, transformerOptsWithCommonJs);

      expect(result.code).toContain(`require("${output}");`);
    });

    it('with a transformed export statement', () => {
      const code = 'let something; export { something };';
      const result = transform(code, transformerOptsWithCommonJs);

      expect(result.code).toBe(stripIndent`
        "use strict";

        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.something = void 0;
        let something = exports.something = void 0;
      `);
    });
  }

  function testImports(source, output, transformerOpts) {
    testImport(source, output, transformerOpts);
    testImportWithCommonJSTransform(source, output, transformerOpts);
  }

  const transformerOpts = {
    babelrc: false,
    plugins: [
      [
        plugin,
        {
          root: './tests/testproject/src',
          cwd,
          alias: {
            test: './tests/testproject/test',
            '@babel/core': '@babel/core/lib',
          },
        },
      ],
    ],
  };

  describe('should resolve the path based on the root config', () => {
    testImports(
      'components/Header/SubHeader',
      './tests/testproject/src/components/Header/SubHeader',
      transformerOpts,
    );
  });

  describe('should alias the path', () => {
    testImports('test', './tests/testproject/test', transformerOpts);
  });

  describe('should not change a relative path', () => {
    testImports('./utils', './utils', transformerOpts);
  });

  describe('should handle an empty path', () => {
    testImports('', '', transformerOpts);
  });

  describe('should only apply the alias once', () => {
    // If this test breaks, consider selecting another package used by the plugin
    testImports(
      '@babel/core/transform',
      '@babel/core/lib/transform',
      transformerOpts,
    );
  });

  it('should ignore the call if a non-import statement is used', () => {
    const code = stripIndent`
      function test() {
        return "components/Sidebar/Footer";
      }
    `;
    const result = transform(code, transformerOpts);

    expect(result.code).toBe(stripIndent`
      function test() {
        return "components/Sidebar/Footer";
      }
    `);
  });
});
