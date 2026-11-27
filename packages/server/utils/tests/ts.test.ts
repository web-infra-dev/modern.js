import os from 'os';
import path from 'path';
import { fs, logger } from '@modern-js/utils';
import { compile } from '../src';

const REAL_TSC = require.resolve('typescript/bin/tsc');

// A project whose `typescript` is a stand-in: `tsc` records the config it was
// given, runs the real tsc of this repo on it (unless `delegate` is false)
// and exits with `exitCode`. The package has no JS entry, like TS 7.
const createStubTypeScriptApp = async (
  version: string,
  exitCode = 0,
  delegate = true,
) => {
  const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'server-utils-ts-'));
  await fs.outputFile(
    path.join(appDir, 'api/index.ts'),
    "export default (): string => 'api';\n",
  );
  await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
    compilerOptions: { target: 'ES2022', baseUrl: './' },
  });
  const tsDir = path.join(appDir, 'node_modules/typescript');
  await fs.outputJSON(path.join(tsDir, 'package.json'), {
    name: 'typescript',
    version,
    bin: { tsc: './bin/tsc' },
  });
  await fs.outputFile(
    path.join(tsDir, 'bin/tsc'),
    [
      "const fs = require('fs');",
      "const project = process.argv[process.argv.indexOf('-p') + 1];",
      "fs.writeFileSync(require('path').join(__dirname, 'last-config.json'), fs.readFileSync(project));",
      delegate
        ? `const real = require('child_process').spawnSync(process.execPath, [${JSON.stringify(REAL_TSC)}, ...process.argv.slice(2)], { encoding: 'utf8' });`
        : "const real = { stdout: '', status: 0 };",
      'process.stdout.write(real.stdout);',
      exitCode ? "console.log('api/index.ts(1,1): error TS2322: stub');" : '',
      `process.exitCode = ${exitCode} || real.status;`,
    ].join('\n'),
  );
  const lastConfig = () =>
    fs.readJSON(path.join(tsDir, 'bin/last-config.json'));
  return { appDir, lastConfig };
};

describe('server compile', () => {
  it('compile typescript', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    // tsconfig.json is bundler-mode (ESNext); the convention file layers the
    // `@modern-js/tsconfig/server` preset on top of it for commonjs output.
    const tsconfigPath = path.join(example, './tsconfig.server.json');
    const distDir = path.join(example, './dist');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');
    const serverDir = path.join(example, './server');

    try {
      await compile(
        example,
        {
          alias: {
            '@modern-js/runtime/server': path.join(
              sharedDir,
              './runtime/server',
            ),
          },
        } as any,
        {
          sourceDirs: [sharedDir, apiDir, serverDir],
          distDir,
          tsconfigPath,
        },
      );
    } catch (error) {
      console.error('compile error', error);
    }

    const distApiDir = path.join(example, './dist', './api');

    const api = require(distApiDir).default;
    expect(api()).toEqual('runtime-shared-api');

    const distServerDir = path.join(distDir, './server');
    const server = require(distServerDir).default;
    expect(server()).toEqual('shared-server');

    const files = await fs.readdir(distServerDir);
    expect(files.length).toBe(2);

    const distSrcDir = path.join(distDir, './src');
    expect(await fs.pathExists(distSrcDir)).toBeFalsy();

    const mapAliasFile = path.join(distApiDir, './map-alias.js');
    expect(await fs.pathExists(mapAliasFile)).toBeTruthy();
    // ignore
    // const mapAliasContent = (await fs.readFile(mapAliasFile)).toString();
    // expect(mapAliasContent).toMatchSnapshot();

    await fs.remove(distDir);
  });

  it('emits commonjs from a bundler-mode tsconfig without a warning', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    // The main tsconfig resolves to `module: ESNext`; the framework passes the
    // CommonJS override when it falls back to it in a commonjs project.
    const tsconfigPath = path.join(example, './tsconfig.json');
    const distDir = path.join(example, './dist-fallback');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');
    const serverDir = path.join(example, './server');
    const warn = rstest.spyOn(logger, 'warn').mockImplementation(() => {});

    const run = () =>
      compile(
        example,
        {
          alias: {
            '@modern-js/runtime/server': path.join(
              sharedDir,
              './runtime/server',
            ),
          },
        } as any,
        {
          sourceDirs: [sharedDir, apiDir, serverDir],
          distDir,
          tsconfigPath,
          moduleType: 'commonjs',
          compilerOverrides: { module: 'CommonJS' },
        },
      );

    try {
      await run();

      const apiContent = (
        await fs.readFile(path.join(distDir, './api/index.js'))
      ).toString();
      expect(apiContent).toMatch(/\bexports\b/);
      expect(apiContent).toContain('require(');
      expect(apiContent).not.toMatch(/^import /m);
      // aliases are rewritten to relative specifiers
      expect(apiContent).toContain('../shared/index');
      expect(apiContent).not.toContain('@shared/');

      const api = require(path.join(distDir, './api')).default;
      expect(api()).toEqual('runtime-shared-api');

      const server = require(path.join(distDir, './server')).default;
      expect(server()).toEqual('shared-server');

      // The output format follows package.json#type, so the fallback no
      // longer changes what is emitted and is not reported.
      expect(warn).not.toBeCalled();
    } finally {
      warn.mockRestore();
      await fs.remove(distDir);
    }
  });

  it('keeps extensionless import() working when it falls back to a bundler-mode tsconfig', async () => {
    const appDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'server-utils-fallback-'),
    );
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      // The previous base preset compiled `import()` to `require()`, so code
      // like this ran without an extension on the specifier.
      await fs.outputFile(
        path.join(appDir, 'server/index.ts'),
        "export const run = async () => (await import('./lazy')).value;\n",
      );
      await fs.outputFile(
        path.join(appDir, 'server/lazy.ts'),
        "export const value = 'lazy';\n",
      );
      await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          skipLibCheck: true,
        },
        include: ['server'],
      });

      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'server')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        moduleType: 'commonjs',
        compilerOverrides: { module: 'CommonJS' },
      });

      expect(error).not.toBeCalled();
      const { run } = require(path.join(appDir, 'dist/server/index.js'));
      await expect(run()).resolves.toBe('lazy');
    } finally {
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it.each([
    ['a file pattern', ['server/**/*.ts', 'types/**/*.ts'], 'types/env.d.ts'],
    ['a root wildcard', ['**/*'], 'env.d.ts'],
  ])(
    'finds ambient declarations through %s in include',
    async (_, include, declarationFile) => {
      const appDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'server-utils-include-'),
      );
      const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
      try {
        await fs.outputFile(
          path.join(appDir, declarationFile),
          'declare const APP_FLAG: string;\n',
        );
        await fs.outputFile(
          path.join(appDir, 'server/index.ts'),
          'export const flag = (): string => APP_FLAG;\n',
        );
        await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
          compilerOptions: {
            target: 'ES2022',
            module: 'CommonJS',
            strict: true,
            skipLibCheck: true,
          },
          include,
        });

        await compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'server')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
          throwErrorInsteadOfExit: true,
        });

        expect(error).not.toBeCalled();
      } finally {
        error.mockRestore();
        await fs.remove(appDir);
      }
    },
  );

  it.each([
    ['5.9.3', 'node'],
    ['6.0.2', 'bundler'],
    ['7.0.0-dev.20261120.1', 'bundler'],
  ])(
    'pairs the CommonJS override with a moduleResolution TypeScript %s accepts',
    async (version, moduleResolution) => {
      // The stub only records the config: TS 6 and 7 are not installed here.
      const { appDir, lastConfig } = await createStubTypeScriptApp(
        version,
        0,
        false,
      );
      try {
        await compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'api')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
          compilerOverrides: { module: 'CommonJS' },
        });
        expect((await lastConfig()).compilerOptions).toMatchObject({
          module: 'CommonJS',
          moduleResolution,
        });
      } finally {
        await fs.remove(appDir);
      }
    },
  );

  it('compiles without the TypeScript JS API and type-checks with the project tsc', async () => {
    const { appDir, lastConfig } = await createStubTypeScriptApp('7.0.2');
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        compilerOverrides: { module: 'CommonJS' },
      });

      const api = require(path.join(appDir, 'dist/api')).default;
      expect(api()).toBe('api');

      const config = await lastConfig();
      expect(config.extends).toBe(
        path.join(appDir, 'tsconfig.json').replace(/\\/g, '/'),
      );
      expect(config.compilerOptions).toMatchObject({
        module: 'CommonJS',
        noEmit: false,
      });
      expect(config.compilerOptions.ignoreDeprecations).toBeUndefined();
      expect(config.include).toEqual([]);
      expect(config.files).toEqual([
        path.join(appDir, 'api/index.ts').replace(/\\/g, '/'),
      ]);
    } finally {
      await fs.remove(appDir);
    }
  });

  it('finds tsc in an aliased TypeScript package such as @typescript/typescript6', async () => {
    // `typescript: npm:@typescript/typescript6` names its command `tsc6`.
    // The version stays 5.x: the real tsc behind the stub is TS 5.9.
    const { appDir, lastConfig } = await createStubTypeScriptApp('5.9.3');
    await fs.outputJSON(
      path.join(appDir, 'node_modules/typescript/package.json'),
      {
        name: '@typescript/typescript6',
        version: '5.9.3',
        bin: { tsc6: './bin/tsc' },
      },
    );
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        compilerOverrides: { module: 'CommonJS' },
      });

      expect(require(path.join(appDir, 'dist/api')).default()).toBe('api');
      // TypeScript 5 rejects `bundler` with CommonJS.
      expect((await lastConfig()).compilerOptions).toMatchObject({
        moduleResolution: 'node',
        noEmit: false,
      });
    } finally {
      await fs.remove(appDir);
    }
  });

  it('runs the compiler named by the tsconfig ts-node.compiler, like ttypescript', async () => {
    const { appDir, lastConfig } = await createStubTypeScriptApp('5.9.3');
    // A fork with a JS API and two commands, neither called `tsc`: the CLI
    // is the `tsc.js` next to the API, as in TypeScript's own layout.
    const forkDir = path.join(appDir, 'node_modules/fork-ts');
    await fs.outputJSON(path.join(forkDir, 'package.json'), {
      name: 'fork-ts',
      version: '5.9.3',
      main: './lib/typescript.js',
      bin: { ttsc: './bin/tsc', ttsserver: './bin/tsserver' },
    });
    await fs.outputFile(path.join(forkDir, 'lib/typescript.js'), '');
    await fs.copy(
      path.join(appDir, 'node_modules/typescript/bin/tsc'),
      path.join(forkDir, 'lib/tsc.js'),
    );
    await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
      compilerOptions: { target: 'ES2022' },
      'ts-node': { compiler: 'fork-ts' },
    });
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        compilerOverrides: { module: 'NodeNext', moduleResolution: 'NodeNext' },
      });

      expect(require(path.join(appDir, 'dist/api')).default()).toBe('api');
      expect(
        await fs.pathExists(path.join(forkDir, 'lib/last-config.json')),
      ).toBe(true);
      await expect(lastConfig()).rejects.toThrow();
    } finally {
      await fs.remove(appDir);
    }
  });

  it('passes the tsconfig references on, so referenced projects are checked by their own config', async () => {
    const { appDir, lastConfig } = await createStubTypeScriptApp('5.9.3');
    const libDir = path.join(appDir, 'lib');
    // `LIB_FLAG` is declared only in the referenced project's own files.
    await fs.outputFile(
      path.join(libDir, 'globals.d.ts'),
      'declare const LIB_FLAG: string;\n',
    );
    await fs.outputFile(
      path.join(libDir, 'index.ts'),
      'export const flag = (): string => LIB_FLAG;\n',
    );
    await fs.outputJSON(path.join(libDir, 'tsconfig.json'), {
      compilerOptions: {
        composite: true,
        module: 'commonjs',
        target: 'ES2022',
        outDir: 'dist',
      },
      include: ['index.ts', 'globals.d.ts'],
    });
    await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
      compilerOptions: { target: 'ES2022' },
      references: [{ path: './lib' }],
    });
    await fs.outputFile(
      path.join(appDir, 'api/index.ts'),
      "import { flag } from '../lib';\nexport default (): string => typeof flag;\n",
    );
    const built = require('child_process').spawnSync(
      process.execPath,
      [REAL_TSC, '-b', libDir],
      { encoding: 'utf8' },
    );
    expect(built.stdout).toBe('');
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        compilerOverrides: { module: 'NodeNext', moduleResolution: 'NodeNext' },
      });

      expect(error).not.toBeCalled();
      expect((await lastConfig()).references).toEqual([
        { path: libDir.replace(/\\/g, '/') },
      ]);
    } finally {
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it.each([
    [
      'sourceMap',
      (dir: string) => fs.readJSON(path.join(dir, 'aliased.js.map')),
    ],
    [
      'inlineSourceMap',
      async (dir: string) => {
        const code = await fs.readFile(path.join(dir, 'aliased.js'), 'utf8');
        const data = code.split('base64,')[1].trim();
        return JSON.parse(Buffer.from(data, 'base64').toString());
      },
    ],
  ] as const)(
    'keeps %s in step with rewritten alias specifiers',
    async (option, readMap) => {
      const ts: typeof import('typescript') = require('typescript');
      const appDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'server-utils-map-'),
      );
      const source =
        'import { value } from "@server/lib/value";\nexport const read = (): string => value + "-" + value;\n';
      await fs.outputFile(
        path.join(appDir, 'server/lib/value.ts'),
        "export const value = 'v';\n",
      );
      await fs.outputFile(path.join(appDir, 'server/aliased.ts'), source);
      await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
        compilerOptions: {
          target: 'ES2022',
          module: 'commonjs',
          [option]: true,
          paths: { '@server/*': ['./server/*'] },
        },
      });
      // What the in-process compile produced: the specifier rewritten by a
      // transformer before emit, so tsc maps the rewritten text.
      const expected = ts.transpileModule(source, {
        fileName: 'aliased.ts',
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
          sourceMap: true,
        },
        transformers: {
          before: [
            () => file =>
              ts.factory.updateSourceFile(
                file,
                file.statements.map(statement =>
                  ts.isImportDeclaration(statement)
                    ? ts.factory.updateImportDeclaration(
                        statement,
                        statement.modifiers,
                        statement.importClause,
                        ts.factory.createStringLiteral('./lib/value'),
                        statement.attributes,
                      )
                    : statement,
                ),
              ),
          ],
        },
      });
      try {
        await compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'server')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
        });
        const out = path.join(appDir, 'dist/server');
        const code = await fs.readFile(path.join(out, 'aliased.js'), 'utf8');
        expect(code.split('//# sourceMappingURL')[0]).toBe(
          expected.outputText.split('//# sourceMappingURL')[0],
        );
        expect((await readMap(out)).mappings).toBe(
          JSON.parse(expected.sourceMapText!).mappings,
        );
      } finally {
        await fs.remove(appDir);
      }
    },
  );

  it('ignores the TypeScript 6 deprecations such as TS5101 in the type check', async () => {
    // The real tsc here is TS 5.9, which rejects `ignoreDeprecations: "6.0"`.
    const { appDir, lastConfig } = await createStubTypeScriptApp(
      '6.0.3',
      0,
      false,
    );
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
      });

      expect((await lastConfig()).compilerOptions.ignoreDeprecations).toBe(
        '6.0',
      );
    } finally {
      await fs.remove(appDir);
    }
  });

  it('fails the build when the type check reports errors', async () => {
    const { appDir } = await createStubTypeScriptApp('5.9.3', 2);
    const exit = rstest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as any);
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      await expect(
        compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'api')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
        }),
      ).rejects.toThrow('process.exit');
      expect(error.mock.calls[0][0]).toContain('TS2322');
    } finally {
      exit.mockRestore();
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it('only reports type errors for a BFF build unless noEmitOnError is true', async () => {
    const { appDir } = await createStubTypeScriptApp('5.9.3', 2);
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        throwErrorInsteadOfExit: true,
      });
      expect(error.mock.calls[0][0]).toContain('TS2322');
      expect(error.mock.calls[1][0]).toContain('"noEmitOnError": true');
      expect(await fs.pathExists(path.join(appDir, 'dist/api/index.js'))).toBe(
        true,
      );
    } finally {
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it('fails a BFF build on type errors when noEmitOnError is true', async () => {
    const { appDir } = await createStubTypeScriptApp('5.9.3', 2);
    await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
      compilerOptions: { target: 'ES2022', noEmitOnError: true },
    });
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      await expect(
        compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'api')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
          throwErrorInsteadOfExit: true,
        }),
      ).rejects.toThrow('"noEmitOnError": true in tsconfig.json');
      expect(error.mock.calls[0][0]).toContain('TS2322');
    } finally {
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it('fails when the compiler cannot run instead of reporting type errors', async () => {
    const { appDir } = await createStubTypeScriptApp('5.9.3');
    await fs.outputFile(
      path.join(appDir, 'node_modules/typescript/bin/tsc'),
      "throw new Error('incompatible compiler');\n",
    );
    try {
      await expect(
        compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'api')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
          throwErrorInsteadOfExit: true,
        }),
      ).rejects.toThrow('incompatible compiler');
    } finally {
      await fs.remove(appDir);
    }
  });

  it('treats coloured --pretty diagnostics as type errors', async () => {
    const { appDir } = await createStubTypeScriptApp('5.9.3');
    await fs.outputFile(
      path.join(appDir, 'node_modules/typescript/bin/tsc'),
      [
        "console.log('api/index.ts:1:1 - \\x1b[91merror\\x1b[0m\\x1b[90m TS2322: \\x1b[0mcoloured');",
        'process.exitCode = 2;',
      ].join('\n'),
    );
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        throwErrorInsteadOfExit: true,
      });
      expect(error.mock.calls[0][0]).toContain('TS2322');
    } finally {
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it('keeps every diagnostic when tsc prints more than 1MB', async () => {
    const { appDir } = await createStubTypeScriptApp('5.9.3', 2);
    await fs.outputFile(
      path.join(appDir, 'node_modules/typescript/bin/tsc'),
      [
        "process.stdout.write('api/index.ts(1,1): error TS2322: noise\\n'.repeat(40000));",
        "console.log('api/index.ts(9,9): error TS2322: last');",
        // exitCode, not exit(): exit() drops output still queued on the pipe
        'process.exitCode = 2;',
      ].join('\n'),
    );
    const exit = rstest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as any);
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      await expect(
        compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'api')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
        }),
      ).rejects.toThrow('process.exit');
      expect(error.mock.calls[0][0]).toContain('error TS2322: last');
    } finally {
      exit.mockRestore();
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it('emits only the tsconfig files and their imports, like the TypeScript program', async () => {
    const appDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'server-utils-files-'),
    );
    try {
      await fs.outputFile(
        path.join(appDir, 'server/entry.ts'),
        "import { marker } from '../shared/marker';\nexport default marker;\n",
      );
      await fs.outputFile(
        path.join(appDir, 'shared/marker.ts'),
        "export const marker = 'marker';\n",
      );
      await fs.outputFile(
        path.join(appDir, 'server/index.ts'),
        "export const collision = 'must-not-emit';\n",
      );
      await fs.outputJSON(path.join(appDir, 'tsconfig.server.json'), {
        compilerOptions: { target: 'ES2020', module: 'commonjs' },
        files: ['server/entry.ts'],
      });

      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'server'), path.join(appDir, 'shared')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.server.json'),
      });

      expect(require(path.join(appDir, 'dist/server/entry')).default).toBe(
        'marker',
      );
      expect(
        await fs.pathExists(path.join(appDir, 'dist/shared/marker.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(appDir, 'dist/server/index.js')),
      ).toBe(false);
    } finally {
      await fs.remove(appDir);
    }
  });

  it('copies imported .json, .mjs and .cjs files outside the server directories into the output', async () => {
    const appDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'server-utils-assets-'),
    );
    try {
      await fs.outputFile(
        path.join(appDir, 'server/index.ts'),
        [
          "import flags from '../config/flags.json';",
          "import helper = require('../lib/helper.cjs');",
          'export default { flags, helper };',
        ].join('\n'),
      );
      await fs.outputJSON(path.join(appDir, 'config/flags.json'), {
        enabled: true,
      });
      await fs.outputFile(
        path.join(appDir, 'lib/helper.cjs'),
        "module.exports = require('./data.json');\n",
      );
      await fs.outputJSON(path.join(appDir, 'lib/data.json'), { cjs: true });
      await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          resolveJsonModule: true,
          allowJs: true,
        },
        include: ['server'],
      });

      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'server')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
      });

      expect(
        require(path.join(appDir, 'dist/server/index.js')).default,
      ).toEqual({ flags: { enabled: true }, helper: { cjs: true } });
    } finally {
      await fs.remove(appDir);
    }
  });

  it('keeps whole-program semantics such as const enums declared in .d.ts files', async () => {
    const appDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'server-utils-enum-'),
    );
    try {
      await fs.outputFile(
        path.join(appDir, 'server/dir.d.ts'),
        'declare const enum Dir { Up = 1, Down = 2 }\n',
      );
      await fs.outputFile(
        path.join(appDir, 'server/index.ts'),
        'export default Dir.Down;\n',
      );
      await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
        compilerOptions: { target: 'ES2022', module: 'commonjs' },
        include: ['server'],
      });
      await fs.ensureSymlink(
        path.dirname(require.resolve('typescript/package.json')),
        path.join(appDir, 'node_modules/typescript'),
      );

      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'server')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
      });

      expect(require(path.join(appDir, 'dist/server/index.js')).default).toBe(
        2,
      );
    } finally {
      await fs.remove(appDir);
    }
  });

  it('rejects unknown compilerOverrides values', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    const distDir = path.join(example, './dist-invalid');

    await expect(
      compile(example, { alias: {} } as any, {
        sourceDirs: [path.join(example, './shared')],
        distDir,
        tsconfigPath: path.join(example, './tsconfig.json'),
        compilerOverrides: { module: 'not-a-module-kind' },
      }),
    ).rejects.toThrow('compilerOverrides.module');

    await fs.remove(distDir);
  });

  it('emits even when the tsconfig is type-check only', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    // `noEmit: true` + `emitDeclarationOnly: true` come from the main
    // project config; the server compile must ignore both.
    const tsconfigPath = path.join(example, './tsconfig.noemit.json');
    const distDir = path.join(example, './dist-noemit');
    const sharedDir = path.join(example, './shared');
    const serverDir = path.join(example, './server');

    try {
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, serverDir],
        distDir,
        tsconfigPath,
      });

      expect(
        await fs.pathExists(path.join(distDir, './server/index.js')),
      ).toBeTruthy();
      const server = require(path.join(distDir, './server')).default;
      expect(server()).toEqual('shared-server');
    } finally {
      await fs.remove(distDir);
    }
  });

  it('rewrites tsconfig path aliases in emitted declarations', async () => {
    const example = path.join(__dirname, './fixtures', './ts-declaration');
    const tsconfigPath = path.join(example, './tsconfig.json');
    const distDir = path.join(example, './dist');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');

    try {
      // tsc never resolves `paths` in `.d.ts` output, so the alias must be
      // rewritten by our `afterDeclarations` transformer.
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, apiDir],
        distDir,
        tsconfigPath,
      });

      const dts = (
        await fs.readFile(path.join(distDir, './api/declaration.d.ts'))
      ).toString();

      // No alias may leak to consumers.
      expect(dts).not.toContain('@shared/types');

      // Every specifier kind is rebased to a relative, extensionless path.
      // ImportDeclaration / ExportDeclaration
      expect(dts).toMatch(/from ["']\.\.\/shared\/types["']/);
      // ImportTypeNode (inline `import("...")` type)
      expect(dts).toContain('import("../shared/types")');
      // ImportEqualsDeclaration (`import x = require("...")`)
      expect(dts).toContain('require("../shared/types")');
    } finally {
      await fs.remove(distDir);
    }
  });

  it('appends .js to declaration specifiers in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './ts-declaration-esm');
    const tsconfigPath = path.join(example, './tsconfig.json');
    const distDir = path.join(example, './dist');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');

    try {
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, apiDir],
        distDir,
        tsconfigPath,
        moduleType: 'module',
      });

      const dts = (
        await fs.readFile(path.join(distDir, './api/index.d.ts'))
      ).toString();

      // In ESM output the declaration specifier must carry the emitted `.js`
      // extension just like the JS output, or `node16`/`nodenext` consumers
      // fail with TS2835. TS resolves `./x.js` back to `./x.d.ts`.
      expect(dts).not.toContain('@shared');
      expect(dts).toContain('from "../shared/types.js"');
      expect(dts).toContain('import("../shared/types.js")');
    } finally {
      await fs.remove(distDir);
    }
  });

  it('should keep .js suffix for aliased imports in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    const tsconfigPath = path.join(example, './tsconfig.esm.json');
    const distDir = path.join(example, './dist-esm');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');
    const serverDir = path.join(example, './server');

    try {
      await compile(
        example,
        {
          alias: {
            '@modern-js/runtime/server': path.join(
              sharedDir,
              './runtime/server',
            ),
          },
        } as any,
        {
          sourceDirs: [sharedDir, apiDir, serverDir],
          distDir,
          tsconfigPath,
          moduleType: 'module',
        },
      );

      const apiContent = await fs.readFile(
        path.join(distDir, './api/index.js'),
      );
      const jsAliasContent = await fs.readFile(
        path.join(distDir, './api/js-alias.js'),
      );
      const relativeContent = await fs.readFile(
        path.join(distDir, './api/relative.js'),
      );

      expect(apiContent.toString()).toContain(`from "../shared/index.js"`);
      expect(jsAliasContent.toString()).toContain(`from "../shared/index.js"`);
      expect(relativeContent.toString()).toContain(`from "../shared/index.js"`);
    } finally {
      await fs.remove(distDir);
    }
  });

  it('should resolve tsx directory entries and emit runnable js in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './tsx-example');
    const tsconfigPath = path.join(example, './tsconfig.esm.json');
    const distDir = path.join(example, './dist-esm');
    const sharedDir = path.join(example, './shared');
    const serverDir = path.join(example, './server');

    try {
      // No alias and no tsconfig `paths`: relative specifiers still have to be
      // rewritten for native ESM.
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, serverDir],
        distDir,
        tsconfigPath,
        moduleType: 'module',
      });

      const serverContent = (
        await fs.readFile(path.join(distDir, './server/index.js'))
      ).toString();

      // `./foo` points at `foo/index.tsx`, so it must not become `./foo.js`.
      expect(serverContent).toContain(`from "./foo/index.js"`);
      expect(serverContent).toContain(`from "../shared/bar.js"`);

      // `jsx: preserve` would emit `foo/index.jsx`, which Node cannot load.
      expect(
        await fs.pathExists(path.join(distDir, './server/foo/index.js')),
      ).toBeTruthy();
      expect(
        await fs.pathExists(path.join(distDir, './server/foo/index.jsx')),
      ).toBeFalsy();

      // Source files must not be copied next to their compiled output.
      expect(
        await fs.pathExists(path.join(distDir, './server/foo/index.tsx')),
      ).toBeFalsy();
    } finally {
      await fs.remove(distDir);
    }
  });

  it('should keep specifiers that are not compiled to js in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './tsx-example');
    const tsconfigPath = path.join(example, './tsconfig.esm.json');
    const distDir = path.join(example, './dist-esm-assets');
    const sharedDir = path.join(example, './shared');
    const serverDir = path.join(example, './server');

    try {
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, serverDir],
        distDir,
        tsconfigPath,
        moduleType: 'module',
      });

      const serverContent = (
        await fs.readFile(path.join(distDir, './server/index.js'))
      ).toString();

      // `.json` and `.mjs` are copied verbatim, so their extensions must stay.
      expect(serverContent).toContain(`"../shared/data.json"`);
      expect(serverContent).not.toContain(`../shared/data.js"`);
      expect(serverContent).toContain(`"./helper.mjs"`);
      expect(serverContent).not.toContain(`"./helper.js"`);

      // Import attributes must survive the specifier rewrite.
      expect(serverContent).toMatch(/type:\s*['"]json['"]/);

      // The options argument of a dynamic import must not be dropped.
      expect(serverContent).toMatch(
        /import\(\s*"\.\.\/shared\/data\.json"\s*,\s*\{/,
      );

      expect(serverContent).toContain(`"./legacy.cjs"`);

      // Non-literal specifiers are resolved at runtime and must be untouched.
      expect(serverContent).toContain('import(`./locales/${lang}.js`)');
      expect(serverContent).toContain(`import('./locales/' + lang + '.js')`);

      expect(
        await fs.pathExists(path.join(distDir, './shared/data.json')),
      ).toBeTruthy();
      expect(
        await fs.pathExists(path.join(distDir, './server/helper.mjs')),
      ).toBeTruthy();
      expect(
        await fs.pathExists(path.join(distDir, './server/legacy.cjs')),
      ).toBeTruthy();
    } finally {
      await fs.remove(distDir);
    }
  });
});
