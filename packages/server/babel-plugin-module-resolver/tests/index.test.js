import path from 'path';

import { transform } from '@babel/core';
import plugin, { resolvePath } from '../src';

const cwd = path.resolve(__dirname, '../');
let originalCwd = process.cwd();
beforeAll(() => {
  originalCwd = process.cwd();
  process.chdir(path.resolve(__dirname, '../'));
});

afterAll(() => {
  process.chdir(originalCwd);
});

describe('module-resolver', () => {
  function testWithImport(source, output, transformerOpts) {
    const code = `import something from "${source}";`;
    const result = transform(code, transformerOpts);

    expect(result.code).toBe(`import something from "${output}";`);
  }

  describe('exports', () => {
    describe('resolvePath', () => {
      it('should be a function', () => {
        expect(resolvePath).toEqual(expect.any(Function));
      });

      it('should resolve the file path', () => {
        const opts = {
          root: ['./tests/testproject/src'],
        };
        const result = resolvePath('app', './tests/testproject/src/app', opts);

        expect(result).toBe('./app');
      });
    });
  });

  describe('root', () => {
    describe('simple root', () => {
      const rootTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/testproject/src',
            },
          ],
        ],
      };

      // biome-ignore lint/suspicious/noFocusedTests: <explanation>
      it.only('should resolve the file path', () => {
        testWithImport(
          'app',
          './tests/testproject/src/app',
          rootTransformerOpts,
        );
      });

      it('should resolve the sub file path', () => {
        testWithImport(
          'components/Root',
          './tests/testproject/src/components/Root',
          rootTransformerOpts,
        );
      });

      it('should resolve a sub file path without /index', () => {
        testWithImport(
          'components/Header',
          './tests/testproject/src/components/Header',
          rootTransformerOpts,
        );
      });

      it('should resolve the file path while keeping the extension', () => {
        testWithImport(
          'components/Header/header.css',
          './tests/testproject/src/components/Header/header.css',
          rootTransformerOpts,
        );
      });

      it('should resolve the file path with an extension that is non-standard in node', () => {
        testWithImport(
          'es6module',
          './tests/testproject/src/es6module',
          rootTransformerOpts,
        );
      });

      it('should resolve the file path with the node module extension', () => {
        testWithImport(
          'nodemodule',
          './tests/testproject/src/nodemodule',
          rootTransformerOpts,
        );
      });

      it('should not resolve the file path with an unknown extension', () => {
        testWithImport('text', 'text', rootTransformerOpts);
      });

      it('should resolve the file path with a filename containing a dot', () => {
        testWithImport(
          'libs/custom.modernizr3',
          './tests/testproject/src/libs/custom.modernizr3',
          rootTransformerOpts,
        );
      });

      it('should resolve to a file instead of a directory', () => {
        // When a file and a directory on the same level share the same name,
        // the file has priority according to the Node require mechanism
        testWithImport('constants', '../constants', {
          ...rootTransformerOpts,
          filename: './tests/testproject/src/constants/actions.js',
        });
      });

      it('should not resolve a path outside of the root directory', () => {
        testWithImport('lodash/omit', 'lodash/omit', rootTransformerOpts);
      });

      it('should not try to resolve a local path', () => {
        testWithImport('./something', './something', rootTransformerOpts);
      });
    });

    describe('multiple roots', () => {
      const rootTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            plugin,
            {
              root: [
                './tests/testproject/src/actions',
                './tests/testproject/src/components',
              ],
            },
          ],
        ],
      };

      it('should resolve the file sub path in root 1', () => {
        testWithImport(
          'something',
          './tests/testproject/src/actions/something',
          rootTransformerOpts,
        );
      });

      it('should resolve the file sub path in root 2', () => {
        testWithImport(
          'Root',
          './tests/testproject/src/components/Root',
          rootTransformerOpts,
        );
      });
    });

    describe('glob root', () => {
      const globRootTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/testproject/src/**',
            },
          ],
        ],
      };

      it('should resolve the file path right inside the glob', () => {
        testWithImport(
          'app',
          './tests/testproject/src/app',
          globRootTransformerOpts,
        );
      });

      it('should resolve the sub file path', () => {
        testWithImport(
          'actions/something',
          './tests/testproject/src/actions/something',
          globRootTransformerOpts,
        );
      });

      it('should resolve the sub file path without specifying the directory', () => {
        testWithImport(
          'something',
          './tests/testproject/src/actions/something',
          globRootTransformerOpts,
        );
      });

      it('should resolve the deep file', () => {
        testWithImport(
          'SidebarFooterButton',
          './tests/testproject/src/components/Sidebar/Footer/SidebarFooterButton',
          globRootTransformerOpts,
        );
      });
    });

    describe('non-standard extensions', () => {
      const rootTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/testproject/src',
              extensions: ['.txt'],
            },
          ],
        ],
      };

      it('should not resolve the file path with an unknown extension', () => {
        testWithImport('app', 'app', rootTransformerOpts);
      });

      it('should resolve the file path with a known defined extension', () => {
        testWithImport(
          'text',
          './tests/testproject/src/text',
          rootTransformerOpts,
        );
      });
    });

    describe('non-standard double extensions', () => {
      const rootTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/testproject/src',
              extensions: ['.ios.js', '.android.js', '.js'],
            },
          ],
        ],
      };

      it('should not resolve the file path with an unknown extension', () => {
        testWithImport('text', 'text', rootTransformerOpts);
      });

      it('should resolve the file path with a known defined extension & strip the extension', () => {
        testWithImport('rn', './tests/testproject/src/rn', rootTransformerOpts);
      });

      it('should resolve the file path with an explicit extension and not strip the extension', () => {
        testWithImport(
          'rn/index.ios.js',
          './tests/testproject/src/rn/index.ios.js',
          rootTransformerOpts,
        );
      });
    });

    describe('non-standard double extensions with strip extensions', () => {
      const rootTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/testproject/src',
              extensions: ['.js', '.ios.js', '.android.js'],
              stripExtensions: [],
            },
          ],
        ],
      };

      it('should not resolve the file path with an unknown extension', () => {
        testWithImport('text', 'text', rootTransformerOpts);
      });

      it('should resolve the file path with a known defined extension', () => {
        testWithImport(
          'rn',
          './tests/testproject/src/rn/index.ios.js',
          rootTransformerOpts,
        );
      });
    });

    describe('root and alias', () => {
      const aliasTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/fakepath/',
              alias: {
                constants: './tests/testproject/src/constants',
              },
            },
          ],
        ],
      };

      it('should resolve the path using alias first and root otherwise', () => {
        testWithImport(
          'constants',
          './tests/testproject/src/constants',
          aliasTransformerOpts,
        );
      });
    });
  });

  describe('alias', () => {
    const aliasTransformerOpts = {
      babelrc: false,
      cwd,
      plugins: [
        [
          plugin,
          {
            alias: {
              test: './tests/testproject/test',
              libs: './tests/testproject/src/libs',
              components: './tests/testproject/src/components',
              '~': './tests/testproject/src',
              'awesome/components': './tests/testproject/src/components',
              'babel-kernel': '@babel/core/lib',
              '^@namespace/foo-(.+)': './packages/\\1',
              'styles/.+\\.(css|less|scss)$': './style-proxy.\\1',
              '^single-backslash': './pas\\\\sed',
              '^non-existing-match': './pas\\42sed',
              '^regexp-priority': './hit',
              'regexp-priority$': './miss',
              'regexp-priority': './miss',
              $src: './tests/testproject/src/',
            },
          },
        ],
      ],
    };

    describe('with a simple alias', () => {
      it('should alias the file path', () => {
        testWithImport(
          'components',
          './tests/testproject/src/components',
          aliasTransformerOpts,
        );
      });

      it('should not alias if there is no proper sub path', () => {
        testWithImport(
          'components_dummy',
          'components_dummy',
          aliasTransformerOpts,
        );
      });

      it('should alias the sub file path', () => {
        testWithImport(
          'test/tools',
          './tests/testproject/test/tools',
          aliasTransformerOpts,
        );
      });
    });

    describe('with alias for a relative path (with respect to the cwd)', () => {
      it('should alias the file path sharing a directory', () => {
        testWithImport('test', './testproject/test', {
          ...aliasTransformerOpts,
          filename: './tests/foo.js',
        });
      });

      it('should alias the file path in another directory', () => {
        testWithImport('test', '../tests/testproject/test', {
          ...aliasTransformerOpts,
          filename: './lib/bar.js',
        });
      });
    });

    describe('with an alias containing a slash', () => {
      it('should alias the file path', () => {
        testWithImport(
          'awesome/components',
          './tests/testproject/src/components',
          aliasTransformerOpts,
        );
      });

      it('should not alias if there is no proper sub path', () => {
        testWithImport(
          'awesome/componentss',
          'awesome/componentss',
          aliasTransformerOpts,
        );
      });

      it('should alias the sub file path', () => {
        testWithImport(
          'awesome/components/Header',
          './tests/testproject/src/components/Header',
          aliasTransformerOpts,
        );
      });
    });

    it('should alias a path containing a dot in the filename', () => {
      testWithImport(
        'libs/custom.modernizr3',
        './tests/testproject/src/libs/custom.modernizr3',
        aliasTransformerOpts,
      );
    });

    it('should alias the path with its extension', () => {
      testWithImport(
        'components/Header/header.css',
        './tests/testproject/src/components/Header/header.css',
        aliasTransformerOpts,
      );
    });

    describe('should not alias a unknown path', () => {
      it('when requiring a node module', () => {
        testWithImport('other-lib', 'other-lib', aliasTransformerOpts);
      });

      it('when requiring a specific un-mapped file', () => {
        testWithImport('./l/otherLib', './l/otherLib', aliasTransformerOpts);
      });
    });

    it('should support aliasing a node module', () => {
      // If this test breaks, consider selecting another package used by the plugin
      testWithImport(
        'babel-kernel/transform',
        '@babel/core/lib/transform',
        aliasTransformerOpts,
      );
    });

    it('should escape regexp', () => {
      // See https://github.com/tleunen/babel-plugin-module-resolver/issues/312
      testWithImport(
        '$src/app',
        './tests/testproject/src/app',
        aliasTransformerOpts,
      );
    });

    describe('with a regular expression', () => {
      it('should support replacing parts of a path', () => {
        testWithImport(
          '@namespace/foo-bar',
          './packages/bar',
          aliasTransformerOpts,
        );
      });

      it('should support replacing parts of a complex path', () => {
        testWithImport(
          '@namespace/foo-bar/component.js',
          './packages/bar/component.js',
          aliasTransformerOpts,
        );
      });

      describe('should support complex regular expressions', () => {
        ['css', 'less', 'scss'].forEach(extension => {
          it(`should handle the alias with the ${extension} extension`, () => {
            testWithImport(
              `styles/style.${extension}`,
              `./style-proxy.${extension}`,
              aliasTransformerOpts,
            );
          });
        });
      });

      it('should ignore unmatched paths', () => {
        testWithImport(
          'styles/style.js',
          'styles/style.js',
          aliasTransformerOpts,
        );
      });

      it('should unescape a double backslash into a single one', () => {
        testWithImport(
          'single-backslash',
          // This is a string literal, so in the code it will actually be "pas\\sed"
          './pas/sed',
          aliasTransformerOpts,
        );
      });

      it('should replace missing matches with an empty string', () => {
        testWithImport('non-existing-match', './passed', aliasTransformerOpts);
      });

      it('should have higher priority than a simple alias', () => {
        testWithImport('regexp-priority', './hit', aliasTransformerOpts);
      });
    });

    describe('with a function', () => {
      const mockSubstitute = rs.fn();
      const regExpSubsituteOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              alias: {
                'basic-function': mockSubstitute,
                '^@regexp-function/(.+)': mockSubstitute,
              },
            },
          ],
        ],
      };

      beforeEach(() => {
        mockSubstitute.mockClear();
      });

      it('should call the substitute with the right arguments (basic)', () => {
        mockSubstitute.mockReturnValue('./tests/testproject/test');

        testWithImport(
          'basic-function/something',
          './tests/testproject/test',
          regExpSubsituteOpts,
        );

        expect(mockSubstitute.mock.calls.length).toBe(1);

        const execResult = Object.assign(
          ['basic-function/something', '/something'],
          {
            index: 0,
            input: 'basic-function/something',
          },
        );
        expect(mockSubstitute).toBeCalledWith(execResult);
      });

      it('should call the substitute with the right arguments (regexp)', () => {
        mockSubstitute.mockReturnValue('./tests/testproject/test');

        testWithImport(
          '@regexp-function/something',
          './tests/testproject/test',
          regExpSubsituteOpts,
        );

        expect(mockSubstitute.mock.calls.length).toBe(1);

        const execResult = Object.assign(
          ['@regexp-function/something', 'something'],
          {
            index: 0,
            input: '@regexp-function/something',
          },
        );
        expect(mockSubstitute).toBeCalledWith(execResult);
      });
    });

    describe('with the plugin applied twice', () => {
      const doubleAliasTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [plugin, { root: '.' }],
          [
            plugin,
            {
              alias: {
                '^@namespace/foo-(.+)': './packages/\\1',
              },
            },
            'second-module-resolver',
          ],
        ],
      };

      it('should support replacing parts of a path', () => {
        testWithImport(
          '@namespace/foo-bar',
          './packages/bar',
          doubleAliasTransformerOpts,
        );
      });
    });

    describe('missing packages warning', () => {
      const mockWarn = rs.fn();
      rs.doMock('../src/log', () => ({
        warn: mockWarn,
      }));
      rs.resetModules();
      const pluginWithMock = rs.requireActual('../src').default;
      const fileName = path.resolve('unknown');

      const missingAliasTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            pluginWithMock,
            {
              alias: {
                legacy: 'npm:legacy',
                'non-existing': 'this-package-does-not-exist',
              },
            },
          ],
        ],
      };

      beforeEach(() => {
        mockWarn.mockClear();
        process.env.NODE_ENV = 'development';
      });

      it('should print a warning for a legacy alias', () => {
        testWithImport(
          'legacy/lib',
          'npm:legacy/lib',
          missingAliasTransformerOpts,
        );

        expect(mockWarn.mock.calls.length).toBe(1);
        expect(mockWarn).toBeCalledWith(
          `Could not resolve "npm:legacy/lib" in file ${fileName}.`,
        );
      });

      it('should print a warning for an unresolved package', () => {
        testWithImport(
          'non-existing/lib',
          'this-package-does-not-exist/lib',
          missingAliasTransformerOpts,
        );

        expect(mockWarn.mock.calls.length).toBe(1);
        expect(mockWarn).toBeCalledWith(
          `Could not resolve "this-package-does-not-exist/lib" in file ${fileName}.`,
        );
      });

      describe('production environment', () => {
        beforeEach(() => {
          process.env.NODE_ENV = 'production';
        });

        it('should print a warning for an unresolved package', () => {
          testWithImport(
            'non-existing/lib',
            'this-package-does-not-exist/lib',
            missingAliasTransformerOpts,
          );

          expect(mockWarn.mock.calls.length).toBe(0);
        });
      });

      const silentLoggingOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            pluginWithMock,
            {
              alias: {
                legacy: 'npm:legacy',
                'non-existing': 'this-package-does-not-exist',
              },
              loglevel: 'silent',
            },
          ],
        ],
      };

      it('should respect opt loglevel:silent', () => {
        testWithImport('legacy/lib', 'npm:legacy/lib', silentLoggingOpts);
        expect(mockWarn.mock.calls.length).toBe(0);
      });
    });

    describe('multiple alias application', () => {
      it('should resolve the cyclic alias only once', () => {
        const fileName = path.resolve('test/testproject/src/app.js');
        const cycleAliasTransformerOpts = {
          babelrc: false,
          cwd,
          plugins: [
            [
              plugin,
              {
                alias: {
                  first: 'second',
                  second: 'first',
                },
              },
            ],
            [
              plugin,
              {
                alias: {
                  first: 'second',
                  second: 'first',
                },
              },
              'second-module-resolver',
            ],
          ],
          filename: fileName,
        };

        testWithImport('first', 'second', cycleAliasTransformerOpts);
      });

      it('should resolve the prefix alias only once', () => {
        const fileName = path.resolve('test/testproject/src/app.js');
        const cycleAliasTransformerOpts = {
          babelrc: false,
          cwd,
          plugins: [
            [
              plugin,
              {
                alias: {
                  prefix: 'prefix/lib',
                },
              },
            ],
            [
              plugin,
              {
                alias: {
                  prefix: 'prefix/lib',
                },
              },
              'second module-resolver',
            ],
          ],
          filename: fileName,
        };

        testWithImport(
          'prefix/test',
          'prefix/lib/test',
          cycleAliasTransformerOpts,
        );
      });
    });

    describe('correct alias order application', () => {
      const arrayAliasTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              alias: [
                {
                  '~/foo': './src/lib/foo',
                },
                {
                  '~/bar': './src/lib/bar',
                },
                {
                  '~': './src',
                },
              ],
            },
          ],
        ],
      };

      it('should resolve aliases following the insertion order', () => {
        testWithImport('~/foo', './src/lib/foo', arrayAliasTransformerOpts);

        testWithImport('~/bar', './src/lib/bar', arrayAliasTransformerOpts);

        testWithImport('~', './src', arrayAliasTransformerOpts);
      });
    });

    describe('dot files', () => {
      const dotFileAliasTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              alias: {
                '.babel': '@babel/core',
                elintrc: './.eslintrc',
                folderdot: './src/folder.',
              },
            },
          ],
        ],
      };

      it('should not match folder names with dot at end', () => {
        testWithImport(
          'folderdot/file',
          './src/folder./file',
          dotFileAliasTransformerOpts,
        );
      });

      it('should resolve alias with dot', () => {
        testWithImport(
          '.babel/register',
          '@babel/core/register',
          dotFileAliasTransformerOpts,
        );
      });

      it('should resolve sibling dot files using alias', () => {
        testWithImport('elintrc', './.eslintrc', dotFileAliasTransformerOpts);
      });
    });
  });

  describe('with custom cwd', () => {
    describe('custom value', () => {
      const transformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './testproject/src',
              cwd: path.resolve('test'),
              alias: {
                constantsAlias: './constants',
                '^constantsRegExp(.*)': './constants\\1',
              },
            },
          ],
        ],
      };

      it('should resolve the file path', () => {
        testWithImport(
          'components/Root',
          './tests/testproject/src/components/Root',
          transformerOpts,
        );
      });

      it('should alias the relative path while honoring cwd', () => {
        testWithImport(
          'constantsAlias/actions',
          './tests/constants/actions',
          transformerOpts,
        );
      });

      it('should alias the relative path while honoring cwd', () => {
        testWithImport(
          'constantsRegExp/actions',
          './tests/constants/actions',
          transformerOpts,
        );
      });
    });

    describe('with root', () => {
      const transformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './src',
              cwd: path.resolve('test/testproject'),
            },
          ],
        ],
      };

      it('should resolve the sub file path', () => {
        testWithImport(
          'components/Root',
          './tests/testproject/src/components/Root',
          transformerOpts,
        );
      });
    });

    describe('with glob root', () => {
      const transformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './testproject/*',
              cwd: path.resolve('test'),
            },
          ],
        ],
      };

      it('should resolve the sub file path', () => {
        testWithImport(
          'components/Root',
          './tests/testproject/src/components/Root',
          transformerOpts,
        );
      });
    });
  });

  describe('babelrc', () => {
    const transformerOpts = {
      babelrc: false,
      cwd,
      plugins: [
        [
          plugin,
          {
            root: './src',
            alias: {
              test: './test',
            },
            cwd: 'babelrc',
          },
        ],
      ],
      filename: './tests/testproject/src/app.js',
    };

    it('should resolve the sub file path', () => {
      testWithImport('components/Root', './components/Root', transformerOpts);
    });

    it('should alias the sub file path', () => {
      testWithImport('test/tools', '../tests/tools', transformerOpts);
    });

    describe('unknown filename', () => {
      const unknownFileTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './src',
              cwd: 'babelrc',
            },
          ],
        ],
      };
      const cachedCwd = process.cwd();
      const babelRcDir = 'test/testproject';

      beforeEach(() => {
        process.chdir(babelRcDir);
      });

      afterEach(() => {
        process.chdir(cachedCwd);
      });

      it('should resolve the sub file path', () => {
        testWithImport(
          'components/Root',
          './src/components/Root',
          unknownFileTransformerOpts,
        );
      });
    });

    describe('missing babelrc in path (uses cwd)', () => {
      rs.resetModules();
      const pluginWithMock = rs.requireActual('../src').default;

      const missingBabelConfigTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            pluginWithMock,
            {
              root: '.',
              cwd: 'babelrc',
            },
          ],
        ],
        filename: './tests/testproject/src/app.js',
      };

      it('should resolve the sub file path', () => {
        testWithImport(
          'test/testproject/src/components/Root',
          './components/Root',
          missingBabelConfigTransformerOpts,
        );
      });
    });
  });

  describe('packagejson', () => {
    const transformerOpts = {
      babelrc: false,
      cwd,
      plugins: [
        [
          plugin,
          {
            root: './src',
            alias: {
              test: './test',
            },
            cwd: 'packagejson',
          },
        ],
      ],
      filename: './tests/testproject/src/app.js',
    };

    it('should resolve the sub file path', () => {
      testWithImport('components/Root', './components/Root', transformerOpts);
    });

    it('should alias the sub file path', () => {
      testWithImport('test/tools', '../tests/tools', transformerOpts);
    });

    // fix: https://github.com/tleunen/babel-plugin-module-resolver/issues/261
    it('Alias with array of paths', () => {
      testWithImport('testArr/tools', '../tests/tools', {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './src',
              alias: {
                testArr: ['./src', '/test', './test'],
              },
              cwd: 'packagejson',
            },
          ],
        ],
        filename: './tests/testproject/src/app.js',
      });
    });

    describe('unknown filename', () => {
      const unknownFileTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './src',
              cwd: 'packagejson',
            },
          ],
        ],
      };
      const cachedCwd = process.cwd();
      const packageJsonDir = 'test/testproject';

      beforeEach(() => {
        process.chdir(packageJsonDir);
      });

      afterEach(() => {
        process.chdir(cachedCwd);
      });

      it('should resolve the sub file path', () => {
        testWithImport(
          'components/Root',
          './src/components/Root',
          unknownFileTransformerOpts,
        );
      });
    });

    describe('missing package.json in path (uses cwd)', () => {
      rs.mock('pkg-up', () => ({
        sync: function pkgUpSync() {
          return null;
        },
      }));
      rs.resetModules();
      const pluginWithMock = rs.requireActual('../src').default;

      const missingPkgJsonConfigTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            pluginWithMock,
            {
              root: '.',
              cwd: 'packagejson',
            },
          ],
        ],
        filename: './tests/testproject/src/app.js',
      };

      it('should resolve the sub file path', () => {
        testWithImport(
          'test/testproject/src/components/Root',
          './components/Root',
          missingPkgJsonConfigTransformerOpts,
        );
      });
    });
  });

  describe('resolvePath', () => {
    it('should work with a custom function', () => {
      const rootTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/testproject/src',
              resolvePath() {
                return 'real path';
              },
            },
          ],
        ],
      };

      testWithImport('app', 'real path', rootTransformerOpts);
    });

    it('should work with the original function', () => {
      const rootTransformerOpts = {
        babelrc: false,
        cwd,
        plugins: [
          [
            plugin,
            {
              root: './tests/testproject/src',
              resolvePath,
            },
          ],
        ],
      };

      testWithImport('app', './tests/testproject/src/app', rootTransformerOpts);
    });
  });
});
