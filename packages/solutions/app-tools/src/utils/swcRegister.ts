import Module from 'node:module';
import path from 'node:path';
import { type Options, transformSync } from '@swc/core';
import { fs, readTsConfigByFile } from '@modern-js/utils';

type CompilerOptions = Record<string, any>;

interface SwcRegisterOptions {
  distDir: string;
  compilerOptions?: CompilerOptions;
}

type ExtensionHandler = (module: NodeJS.Module, filename: string) => void;

const TS_EXTENSIONS = ['.ts', '.tsx', '.cts'];

const ES2022_OR_LATER = /^es(20(2[2-9]|[3-9]\d)|next)$/i;

// Only the first call installs the require hooks; later calls (e.g. a dev
// restart in the same process) just swap the options they read.
let currentOptions: SwcRegisterOptions | undefined;

const resolveExtendedConfig = (extendsPath: string, fromDir: string) => {
  const candidates = extendsPath.endsWith('.json')
    ? [extendsPath]
    : [extendsPath, `${extendsPath}.json`, `${extendsPath}/tsconfig.json`];
  for (const candidate of candidates) {
    try {
      return require.resolve(candidate, { paths: [fromDir] });
    } catch {}
  }
  return undefined;
};

/**
 * Read `compilerOptions` of a tsconfig file, following `extends` so options
 * like `experimentalDecorators` from a shared base config are respected.
 */
export const readCompilerOptions = (
  tsconfigPath: string,
  visited = new Set<string>(),
): CompilerOptions => {
  if (visited.has(tsconfigPath)) {
    return {};
  }
  visited.add(tsconfigPath);

  const config = readTsConfigByFile(tsconfigPath);
  const extendsList: string[] = config.extends
    ? ([] as string[]).concat(config.extends)
    : [];
  const baseOptions = extendsList.reduce<CompilerOptions>(
    (result, extendsPath) => {
      const resolved = resolveExtendedConfig(
        extendsPath,
        path.dirname(tsconfigPath),
      );
      return resolved
        ? { ...result, ...readCompilerOptions(resolved, visited) }
        : result;
    },
    {},
  );

  return { ...baseOptions, ...config.compilerOptions };
};

const isIgnored = (filename: string, distDir: string) => {
  if (filename.split(path.sep).includes('node_modules')) {
    return true;
  }
  const relativeToDist = path.relative(distDir, filename);
  return !relativeToDist.startsWith('..') && !path.isAbsolute(relativeToDist);
};

export const createSwcOptions = (
  filename: string,
  compilerOptions: CompilerOptions = {},
): Options => {
  const tsx = filename.endsWith('.tsx');
  const useDefineForClassFields =
    compilerOptions.useDefineForClassFields ??
    ES2022_OR_LATER.test(String(compilerOptions.target ?? ''));

  return {
    filename,
    swcrc: false,
    configFile: false,
    sourceMaps: 'inline',
    module: { type: 'commonjs' },
    jsc: {
      target: 'es2022',
      parser: {
        syntax: 'typescript',
        tsx,
        decorators: Boolean(compilerOptions.experimentalDecorators),
      },
      transform: {
        legacyDecorator: Boolean(compilerOptions.experimentalDecorators),
        decoratorMetadata: Boolean(compilerOptions.emitDecoratorMetadata),
        useDefineForClassFields,
        react: {
          runtime: compilerOptions.jsx === 'react' ? 'classic' : 'automatic',
          importSource: compilerOptions.jsxImportSource,
        },
      },
    },
  };
};

/**
 * Compile `.ts` files to CommonJS with swc through CJS require hooks.
 *
 * Used when ts-node is not installed. Unlike Node.js native type stripping,
 * the compiled modules live in `require.cache`, so the dev server can reload
 * them by deleting cache entries, and syntax that needs transforming (enum,
 * decorators, parameter properties, etc.) keeps working.
 */
export const registerSwc = (options: SwcRegisterOptions) => {
  const shouldInstall = !currentOptions;
  currentOptions = options;
  if (!shouldInstall) {
    return;
  }

  const extensions = (Module as any)._extensions as Record<
    string,
    ExtensionHandler
  >;

  for (const ext of TS_EXTENSIONS) {
    const originalHandler = extensions[ext];
    extensions[ext] = (module, filename) => {
      const { distDir, compilerOptions } = currentOptions!;
      if (isIgnored(filename, distDir)) {
        (originalHandler || extensions['.js'])(module, filename);
        return;
      }
      const source = fs.readFileSync(filename, 'utf-8');
      const { code } = transformSync(
        source,
        createSwcOptions(filename, compilerOptions),
      );
      (module as any)._compile(code, filename);
    };
  }
};
