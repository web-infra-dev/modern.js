import path from 'path';
import type { Compiler } from './Compiler';
import { EntryPlugin } from './plugins/EntryPlugin';
import { DependencyPlugin } from './plugins/DependencyPlugin';
import { ComponentClassesPlugin } from './plugins/ComponentClassesPlugin';
import { LodashPlugin } from './plugins/LodashPlugin';
import { XlsxPlugin } from './plugins/XlsxPlugin';
import { RewriteExportsPlugin } from './plugins/RewriteExportsPlugin';
import { ReactUsePlugin } from './plugins/ReactUsePlugin';
import { AntDesignPlugin } from './plugins/AntDesignPlugin';
import { EchartsPlugin } from './plugins/EchartsPlugin';
import { JWSPlugin } from './plugins/JWSPlugin';

export interface EsmpackPlugin {
  apply: (compiler: Compiler) => void;
}

export type EnvironmentVariables = Record<string, string | true>;

export interface EsmpackOptions {
  /**
   * If specified, esmpack will auto run for the specifier,
   * otherwise, should be specified when invoking compile.run
   */
  specifier?: string | null;
  /**
   * start path when resolving specifier
   * @default cwd
   */
  importer?: string | null;
  /**
   * Current working directory. project root path
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Output directory, absolute path or relative to cwd
   * @default dist
   */
  outDir?: string;
  /**
   * Environment settings
   * @example { NODE_ENV: 'production' }
   */
  env?: EnvironmentVariables;
  /**
   * Esmpack plugins
   */
  plugins?: EsmpackPlugin[];
}

export type NormalizedEsmpackOptions = Required<EsmpackOptions>;

export const normalizeOptions = (
  options: EsmpackOptions,
): NormalizedEsmpackOptions => {
  const normalizedOptions: NormalizedEsmpackOptions = {
    specifier: null,
    importer: null,
    cwd: process.cwd(),
    outDir: 'dist',
    env: {
      NODE_ENV: 'production',
    },
    plugins: [],
    ...options,
  };
  if (!path.isAbsolute(normalizedOptions.outDir)) {
    normalizedOptions.outDir = path.resolve(
      normalizedOptions.cwd,
      normalizedOptions.outDir,
    );
  }
  return normalizedOptions;
};

export const optionsApply = (
  options: NormalizedEsmpackOptions,
  compiler: Compiler,
) => {
  for (const plugin of options.plugins) {
    plugin.apply(compiler);
  }

  new EntryPlugin(options.cwd).apply(compiler);
  new DependencyPlugin().apply(compiler);
  new RewriteExportsPlugin().apply(compiler);

  // Third-party module
  new ComponentClassesPlugin().apply(compiler);
  new LodashPlugin().apply(compiler);
  new XlsxPlugin().apply(compiler);
  new ReactUsePlugin().apply(compiler);
  new AntDesignPlugin().apply(compiler);
  new EchartsPlugin().apply(compiler);
  new JWSPlugin().apply(compiler);
};
