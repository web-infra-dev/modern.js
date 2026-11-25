import path from 'path';
import {
  fs,
  getAliasConfig,
  logger,
  readTsConfigWithExtends,
} from '@modern-js/utils';
import type { CompileFunc } from '../../common';
import { copyFiles } from '../swc';
import { listRootFiles } from '../swc/files';
import { createSpecifierRewriter, rewriteSpecifiers } from '../swc/specifiers';
import {
  reportTypeCheck,
  runTypeCheck,
  validateCompilerOverrides,
} from '../swc/typecheck';

const JS_OUTPUT = /\.[cm]?js$/;
const DECLARATION_OUTPUT = /\.d\.[cm]?ts$/;

/**
 * Compile `api/`, `server/` and `shared/` with the project's own `tsc`
 * command: one run type-checks and emits the whole program, as the
 * in-process TypeScript compile did, so the output keeps tsc's semantics
 * (const enums, elided type-only exports, decorator metadata). The command
 * works with every TypeScript version, including 7, which no longer ships
 * the JS API. tsc does not rewrite `paths` aliases, so the emitted files get
 * them rewritten to relative specifiers afterwards, together with the `.js`
 * extensions native ESM output needs.
 */
export const compileByTsc: CompileFunc = async (
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

  const { compilerOptions } = readTsConfigWithExtends(tsconfigPath);
  const programFiles = await listRootFiles({
    tsconfigPath,
    sourceDirs,
    distDir,
    allowJs: Boolean(compilerOptions.allowJs),
  });
  const jsx = String(compilerOptions.jsx ?? '').toLowerCase();
  const check = runTypeCheck({
    appDirectory,
    tsconfigPath,
    sourceDirs,
    distDir,
    programFiles,
    compilerOverrides,
    declaration: Boolean(
      compilerOptions.declaration || compilerOptions.composite,
    ),
    emit: true,
    // JSX has to become calls Node can run.
    jsx: !jsx || jsx === 'preserve' ? 'react-jsx' : undefined,
  });
  if (!check) {
    return;
  }

  const { paths = {}, absoluteBaseUrl = './' } = getAliasConfig(config.alias, {
    appDirectory,
    tsconfigPath,
  });
  const rewrite = createSpecifierRewriter(
    absoluteBaseUrl,
    paths,
    compileOptions.moduleType,
  );
  if (rewrite) {
    await Promise.all(
      check.emitted
        .filter(file => JS_OUTPUT.test(file) || DECLARATION_OUTPUT.test(file))
        .map(async file => {
          // The output mirrors the source tree, so specifiers are resolved
          // from where the source file lives.
          const importer = path.join(
            appDirectory,
            path.relative(distDir, file),
          );
          const source = await fs.readFile(file, 'utf8');
          const next = rewriteSpecifiers(source, importer, rewrite, {
            typescript: DECLARATION_OUTPUT.test(file),
            requires: JS_OUTPUT.test(file),
          });
          if (next !== source) {
            await fs.writeFile(file, next);
          }
        }),
    );
  }

  for (const source of sourceDirs) {
    await copyFiles(source, distDir, appDirectory);
  }

  reportTypeCheck(check, {
    appDirectory,
    tsconfigPath,
    compilerOptions,
    throwErrorInsteadOfExit: compileOptions.throwErrorInsteadOfExit,
  });

  logger.info('Server code compiled');
};
