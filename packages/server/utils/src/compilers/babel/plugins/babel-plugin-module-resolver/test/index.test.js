import path from 'path';

import { transform } from '@babel/core';
import plugin, { resolvePath } from '../src';

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
          root: ['./test/testproject/src'],
        };
        const result = resolvePath('app', './test/testproject/src/app', opts);

        expect(result).toBe('./app');
      });
    });
  });

  describe('root', () => {
    describe('simple root', () => {
      const rootTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            plugin,
            {
              root: './test/testproject/src',
            },
          ],
        ],
      };

      it.only('should resolve the file path', () => {
        testWithImport(
          'app',
          './test/testproject/src/app',
          rootTransformerOpts,
        );
      });

      it('should resolve the sub file path', () => {
        testWithImport(
          'components/Root',
          './test/testproject/src/components/Root',
          rootTransformerOpts,
        );
      });

      it('should resolve a sub file path without /index', () => {
        testWithImport(
          'components/Header',
          './test/testproject/src/components/Header',
          rootTransformerOpts,
        );
      });

      it('should resolve the file path while keeping the extension', () => {
        testWithImport(
          'components/Header/header.css',
          './test/testproject/src/components/Header/header.css',
          rootTransformerOpts,
        );
      });

      it('should resolve the file path with an extension that is non-standard in node', () => {
        testWithImport(
          'es6module',
          './test/testproject/src/es6module',
          rootTransformerOpts,
        );
      });

      it('should resolve the file path with the node module extension', () => {
        testWithImport(
          'nodemodule',
          './test/testproject/src/nodemodule',
          rootTransformerOpts,
        );
      });

      it('should not resolve the file path with an unknown extension', () => {
        testWithImport('text', 'text', rootTransformerOpts);
      });

      it('should resolve the file path with a filename containing a dot', () => {
        testWithImport(
          'libs/custom.modernizr3',
          './test/testproject/src/libs/custom.modernizr3',
          rootTransformerOpts,
        );
      });

      it('should resolve to a file instead of a directory', () => {
        // When a file and a directory on the same level share the same name,
        // the file has priority according to the Node require mechanism
        testWithImport('constants', '../constants', {
          ...rootTransformerOpts,
          filename: './test/testproject/src/constants/actions.js',
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
                './test/testproject/src/actions',
                './test/testproject/src/components',
              ],
            },
          ],
        ],
      };

      it('should resolve the file sub path in root 1', () => {
        testWithImport(
          'something',
          './test/testproject/src/actions/something',
          rootTransformerOpts,
        );
      });

      it('should resolve the file sub path in root 2', () => {
        testWithImport(
          'Root',
          './test/testproject/src/components/Root',
          rootTransformerOpts,
        );
      });
    });

    describe('glob root', () => {
      const globRootTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            plugin,
            {
              root: './test/testproject/src/**',
            },
          ],
        ],
      };

      it('should resolve the file path right inside the glob', () => {
        testWithImport(
          'app',
          './test/testproject/src/app',
          globRootTransformerOpts,
        );
      });

      it('should resolve the sub file path', () => {
        testWithImport(
          'actions/something',
          './test/testproject/src/actions/something',
          globRootTransformerOpts,
        );
      });

      it('should resolve the sub file path without specifying the directory', () => {
        testWithImport(
          'something',
          './test/testproject/src/actions/something',
          globRootTransformerOpts,
        );
      });

      it('should resolve the deep file', () => {
        testWithImport(
          'SidebarFooterButton',
          './test/testproject/src/components/Sidebar/Footer/SidebarFooterButton',
          globRootTransformerOpts,
        );
      });
    });

    describe('non-standard extensions', () => {
      const rootTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            plugin,
            {
              root: './test/testproject/src',
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
          './test/testproject/src/text',
          rootTransformerOpts,
        );
      });
    });

    describe('non-standard double extensions', () => {
      const rootTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            plugin,
            {
              root: './test/testproject/src',
              extensions: ['.ios.js', '.android.js', '.js'],
            },
          ],
        ],
      };

      it('should not resolve the file path with an unknown extension', () => {
        testWithImport('text', 'text', rootTransformerOpts);
      });

      it('should resolve the file path with a known defined extension & strip the extension', () => {
        testWithImport('rn', './test/testproject/src/rn', rootTransformerOpts);
      });

      it('should resolve the file path with an explicit extension and not strip the extension', () => {
        testWithImport(
          'rn/index.ios.js',
          './test/testproject/src/rn/index.ios.js',
          rootTransformerOpts,
        );
      });
    });

    describe('non-standard double extensions with strip extensions', () => {
      const rootTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            plugin,
            {
              root: './test/testproject/src',
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
          './test/testproject/src/rn/index.ios.js',
          rootTransformerOpts,
        );
      });
    });

    describe('root and alias', () => {
      const aliasTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            plugin,
            {
              root: './test/fakepath/',
              alias: {
                constants: './test/testproject/src/constants',
              },
            },
          ],
        ],
      };

      it('should resolve the path using alias first and root otherwise', () => {
        testWithImport(
          'constants',
          './test/testproject/src/constants',
          aliasTransformerOpts,
        );
      });
    });
  });

  describe('alias', () => {
    const aliasTransformerOpts = {
      babelrc: false,
      plugins: [
        [
          plugin,
          {
            alias: {
              test: './test/testproject/test',
              libs: './test/testproject/src/libs',
              components: './test/testproject/src/components',
              '~': './test/testproject/src',
              'awesome/components': './test/testproject/src/components',
              'babel-kernel': '@babel/core/lib',
              '^@namespace/foo-(.+)': './packages/\\1',
              'styles/.+\\.(css|less|scss)$': './style-proxy.\\1',
              '^single-backslash': './pas\\\\sed',
              '^non-existing-match': './pas\\42sed',
              '^regexp-priority': './hit',
              'regexp-priority$': './miss',
              'regexp-priority': './miss',
              $src: './test/testproject/src/',
            },
          },
        ],
      ],
    };

    describe('with a simple alias', () => {
      it('should alias the file path', () => {
        testWithImport(
          'components',
          './test/testproject/src/components',
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
          './test/testproject/test/tools',
          aliasTransformerOpts,
        );
      });
    });

    describe('with alias for a relative path (with respect to the cwd)', () => {
      it('should alias the file path sharing a directory', () => {
        testWithImport('test', './testproject/test', {
          ...aliasTransformerOpts,
          filename: './test/foo.js',
        });
      });

      it('should alias the file path in another directory', () => {
        testWithImport('test', '../test/testproject/test', {
          ...aliasTransformerOpts,
          filename: './lib/bar.js',
        });
      });
    });

    describe('with an alias containing a slash', () => {
      it('should alias the file path', () => {
        testWithImport(
          'awesome/components',
          './test/testproject/src/components',
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
          './test/testproject/src/components/Header',
          aliasTransformerOpts,
        );
      });
    });

    it('should alias a path containing a dot in the filename', () => {
      testWithImport(
        'libs/custom.modernizr3',
        './test/testproject/src/libs/custom.modernizr3',
        aliasTransformerOpts,
      );
    });

    it('should alias the path with its extension', () => {
      testWithImport(
        'components/Header/header.css',
        './test/testproject/src/components/Header/header.css',
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
        './test/testproject/src/app',
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
      const mockSubstitute = jest.fn();
      const regExpSubsituteOpts = {
        babelrc: false,
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
        mockSubstitute.mockReturnValue('./test/testproject/test');

        testWithImport(
          'basic-function/something',
          './test/testproject/test',
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
        mockSubstitute.mockReturnValue('./test/testproject/test');

        testWithImport(
          '@regexp-function/something',
          './test/testproject/test',
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
      const mockWarn = jest.fn();
      jest.mock('../src/log', () => ({
        warn: mockWarn,
      }));
      jest.resetModules();
      const pluginWithMock = jest.requireActual('../src').default;
      const fileName = path.resolve('unknown');

      const missingAliasTransformerOpts = {
        babelrc: false,
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
          './test/testproject/src/components/Root',
          transformerOpts,
        );
      });

      it('should alias the relative path while honoring cwd', () => {
        testWithImport(
          'constantsAlias/actions',
          './test/constants/actions',
          transformerOpts,
        );
      });

      it('should alias the relative path while honoring cwd', () => {
        testWithImport(
          'constantsRegExp/actions',
          './test/constants/actions',
          transformerOpts,
        );
      });
    });

    describe('with root', () => {
      const transformerOpts = {
        babelrc: false,
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
          './test/testproject/src/components/Root',
          transformerOpts,
        );
      });
    });

    describe('with glob root', () => {
      const transformerOpts = {
        babelrc: false,
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
          './test/testproject/src/components/Root',
          transformerOpts,
        );
      });
    });
  });

  describe('babelrc', () => {
    const transformerOpts = {
      babelrc: false,
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
      filename: './test/testproject/src/app.js',
    };

    it('should resolve the sub file path', () => {
      testWithImport('components/Root', './components/Root', transformerOpts);
    });

    it('should alias the sub file path', () => {
      testWithImport('test/tools', '../test/tools', transformerOpts);
    });

    describe('unknown filename', () => {
      const unknownFileTransformerOpts = {
        babelrc: false,
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
      jest.mock('find-babel-config', () => ({
        // eslint-disable-next-line func-name-matching
        sync: function findBabelConfigSync() {
          return { file: null, config: null };
        },
      }));
      jest.resetModules();
      const pluginWithMock = jest.requireActual('../src').default;

      const missingBabelConfigTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            pluginWithMock,
            {
              root: '.',
              cwd: 'babelrc',
            },
          ],
        ],
        filename: './test/testproject/src/app.js',
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
      filename: './test/testproject/src/app.js',
    };

    it('should resolve the sub file path', () => {
      testWithImport('components/Root', './components/Root', transformerOpts);
    });

    it('should alias the sub file path', () => {
      testWithImport('test/tools', '../test/tools', transformerOpts);
    });

    // fix: https://github.com/tleunen/babel-plugin-module-resolver/issues/261
    it('Alias with array of paths', () => {
      testWithImport('testArr/tools', '../test/tools', {
        babelrc: false,
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
        filename: './test/testproject/src/app.js',
      });
    });

    describe('unknown filename', () => {
      const unknownFileTransformerOpts = {
        babelrc: false,
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
      jest.mock('pkg-up', () => ({
        // eslint-disable-next-line func-name-matching
        sync: function pkgUpSync() {
          return null;
        },
      }));
      jest.resetModules();
      const pluginWithMock = jest.requireActual('../src').default;

      const missingPkgJsonConfigTransformerOpts = {
        babelrc: false,
        plugins: [
          [
            pluginWithMock,
            {
              root: '.',
              cwd: 'packagejson',
            },
          ],
        ],
        filename: './test/testproject/src/app.js',
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
        plugins: [
          [
            plugin,
            {
              root: './test/testproject/src',
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
        plugins: [
          [
            plugin,
            {
              root: './test/testproject/src',
              resolvePath,
            },
          ],
        ],
      };

      testWithImport('app', './test/testproject/src/app', rootTransformerOpts);
    });
  });
});
