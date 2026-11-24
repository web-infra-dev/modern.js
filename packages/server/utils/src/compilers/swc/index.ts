import path from 'path';
import {
  fs,
  getAliasConfig,
  logger,
  readTsConfigWithExtends,
} from '@modern-js/utils';
import { type Options, transform } from '@swc/core';
import type { CompileFunc } from '../../common';
import { listProgramFiles } from './files';
import {
  type ScannedSource,
  createSpecifierRewriter,
  rewriteSpecifiers,
} from './specifiers';
import { runTypeCheck, validateCompilerOverrides } from './typecheck';

type CompilerOptions = Record<string, any>;

// Source extensions the server compile emits, and the extension each emits.
const OUTPUT_EXTENSIONS: Record<string, string> = {
  '.ts': '.js',
  '.tsx': '.js',
  '.js': '.js',
  '.jsx': '.js',
  '.mts': '.mjs',
  '.cts': '.cjs',
};

const SWC_TARGETS = new Set([
  'es5',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  'es2021',
  'es2022',
  'esnext',
]);

const toSwcTarget = (
  target: unknown,
): NonNullable<Options['jsc']>['target'] => {
  const value = String(target ?? '').toLowerCase();
  if (value === 'es6') {
    return 'es2015';
  }
  return (SWC_TARGETS.has(value) ? value : 'es2022') as NonNullable<
    Options['jsc']
  >['target'];
};

const ES2022_OR_LATER = /^es(20(2[2-9]|[3-9]\d)|next)$/i;

export const createSwcOptions = (
  filename: string,
  compilerOptions: CompilerOptions,
  moduleType: 'module' | 'commonjs',
): Options => {
  const ext = path.extname(filename);
  const typescript = ['.ts', '.tsx', '.mts', '.cts'].includes(ext);
  const esm = ext === '.mts' || (ext !== '.cts' && moduleType === 'module');
  const decorators = Boolean(compilerOptions.experimentalDecorators);
  const useDefineForClassFields =
    compilerOptions.useDefineForClassFields ??
    ES2022_OR_LATER.test(String(compilerOptions.target ?? ''));
  // `esModuleInterop` / `allowSyntheticDefaultImports` off means a default
  // import reads `.default` straight from `require()`, as tsc emits it.
  const interop =
    compilerOptions.esModuleInterop === false &&
    !compilerOptions.allowSyntheticDefaultImports
      ? 'none'
      : 'swc';

  return {
    filename,
    swcrc: false,
    configFile: false,
    sourceMaps: compilerOptions.inlineSourceMap
      ? 'inline'
      : Boolean(compilerOptions.sourceMap),
    module: esm
      ? { type: 'es6' }
      : { type: 'commonjs', importInterop: interop },
    jsc: {
      target: toSwcTarget(compilerOptions.target),
      keepClassNames: true,
      parser: typescript
        ? { syntax: 'typescript', tsx: ext === '.tsx', decorators }
        : { syntax: 'ecmascript', jsx: true, decorators },
      transform: {
        legacyDecorator: decorators,
        decoratorMetadata: Boolean(compilerOptions.emitDecoratorMetadata),
        useDefineForClassFields,
        react: {
          // `jsx: preserve` would leave JSX that Node cannot run, so only the
          // classic `react` mode keeps `React.createElement`.
          runtime: compilerOptions.jsx === 'react' ? 'classic' : 'automatic',
          importSource: compilerOptions.jsxImportSource,
          pragma: compilerOptions.jsxFactory,
          pragmaFrag: compilerOptions.jsxFragmentFactory,
        },
      },
    },
  };
};

const copyFiles = async (from: string, to: string, appDirectory: string) => {
  if (await fs.pathExists(from)) {
    const relativePath = path.relative(appDirectory, from);
    const targetDir = path.join(to, relativePath);
    await fs.copy(from, targetDir, {
      filter: src =>
        !OUTPUT_EXTENSIONS[path.extname(src)] && !src.endsWith('tsconfig.json'),
    });
  }
};

const rewriteDeclarationFiles = async (
  appDirectory: string,
  distDir: string,
  sourceDirs: string[],
  rewrite: NonNullable<ReturnType<typeof createSpecifierRewriter>>,
) => {
  for (const sourceDir of sourceDirs) {
    const outDir = path.join(distDir, path.relative(appDirectory, sourceDir));
    if (!(await fs.pathExists(outDir))) {
      continue;
    }
    const walk = async (current: string) => {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        const file = path.join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(file);
        } else if (/\.d\.[cm]?ts$/.test(entry.name)) {
          // Specifiers are resolved from where the source file lives.
          const importer = path.join(
            appDirectory,
            path.relative(distDir, file).replace(/\.d\.([cm]?)ts$/, '.$1ts'),
          );
          const source = await fs.readFile(file, 'utf8');
          const next = rewriteSpecifiers(source, importer, rewrite, {
            typescript: true,
          });
          if (next !== source) {
            await fs.writeFile(file, next);
          }
        }
      }
    };
    await walk(outDir);
  }
};

/**
 * Compile `api/`, `server/` and `shared/` file by file with swc. The output
 * keeps the source layout (BFF routes are discovered from it) and its module
 * format follows `package.json#type`. Type checking and `.d.ts` come from the
 * project's own `tsc`, run as a command, so the compile does not depend on
 * the TypeScript JS API (which TypeScript 7 no longer ships).
 */
export const compileBySwc: CompileFunc = async (
  appDirectory,
  config,
  compileOptions,
) => {
  const { sourceDirs, distDir, tsconfigPath, compilerOverrides } =
    compileOptions;
  if (!tsconfigPath) {
    return;
  }
  validateCompilerOverrides(compilerOverrides);
  logger.info('Compiling server code...');

  const moduleType = compileOptions.moduleType ?? 'commonjs';
  const { compilerOptions } = readTsConfigWithExtends(tsconfigPath);
  const { paths = {}, absoluteBaseUrl = './' } = getAliasConfig(config.alias, {
    appDirectory,
    tsconfigPath,
  });
  const rewrite = createSpecifierRewriter(
    absoluteBaseUrl,
    paths,
    compileOptions.moduleType,
  );

  const scanned = new Map<string, ScannedSource>();
  const programFiles = await listProgramFiles({
    appDirectory,
    tsconfigPath,
    sourceDirs,
    distDir,
    rewrite,
    scanned,
  });
  // swc transforms on its own threads, so the files are compiled in parallel.
  await Promise.all(
    programFiles.map(async file => {
      const ext = path.extname(file);
      const options = createSwcOptions(file, compilerOptions, moduleType);
      const scan = scanned.get(file);
      const source = scan?.source ?? (await fs.readFile(file, 'utf8'));
      const input = rewrite
        ? rewriteSpecifiers(
            source,
            file,
            rewrite,
            {
              typescript: ['.ts', '.tsx', '.mts', '.cts'].includes(ext),
              tsx: ext === '.tsx',
            },
            scan,
          )
        : source;
      const { code, map } = await transform(input, options);
      const outFile = path
        .join(distDir, path.relative(appDirectory, file))
        .replace(/\.[^.]+$/, OUTPUT_EXTENSIONS[ext]);
      await fs.outputFile(
        outFile,
        map
          ? `${code}\n//# sourceMappingURL=${path.basename(outFile)}.map\n`
          : code,
      );
      if (map) {
        await fs.outputFile(`${outFile}.map`, map);
      }
    }),
  );

  for (const source of sourceDirs) {
    await copyFiles(source, distDir, appDirectory);
  }

  const declaration = Boolean(compilerOptions.declaration);
  const check = runTypeCheck({
    appDirectory,
    tsconfigPath,
    sourceDirs,
    distDir,
    programFiles,
    compilerOverrides,
    declaration,
  });
  if (!check) {
    logger.warn(
      'typescript is not installed, so the server code was compiled without type checking.',
    );
  } else if (!check.ok) {
    logger.error(check.output);
    const { noEmitOnError } = compilerOptions;
    const tsconfigFile = path.relative(appDirectory, tsconfigPath);
    if (compileOptions.throwErrorInsteadOfExit) {
      // BFF builds only reported type errors before, so failing stays opt-in.
      if (noEmitOnError === true) {
        throw new Error(
          `TypeScript compilation failed ("noEmitOnError": true in ${tsconfigFile}).`,
        );
      }
      logger.error(
        `TypeScript compilation failed. Set "noEmitOnError": true in ${tsconfigFile} to fail the build on type errors.`,
      );
    } else if (noEmitOnError === undefined || noEmitOnError === true) {
      logger.error(
        `TypeScript compilation failed. To report type errors without failing the build, set "noEmitOnError": false in ${tsconfigFile}.`,
      );
      process.exit(1);
    }
  }

  if (declaration && rewrite) {
    await rewriteDeclarationFiles(appDirectory, distDir, sourceDirs, rewrite);
  }

  logger.info('Server code compiled');
};
