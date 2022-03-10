export type EnvOptions = Partial<{
  targets:
    | string
    | string[]
    | Record<string, string>
    | Partial<{
        esmodules: boolean;
        node: string | 'current';
        safari: string | 'tp';
        browsers: string[];
      }>;
  bugfixes: boolean;
  spec: boolean;
  loose: boolean;
  modules: 'amd' | 'umd' | 'systemjs' | 'commonjs' | 'cjs' | 'auto' | false;
  debug: boolean;
  include: string[];
  exclude: string[];
  useBuiltIns: 'usage' | 'entry' | false;
  corejs: string | { version: string; proposals: boolean };
  forceAllTransforms: boolean;
  configPath: string;
  ignoreBrowserslistConfig: boolean;
  browserslistEnv: string;
  shippedProposals: boolean;
}>;

export interface IStyledComponentOptions {
  pure?: boolean;
  displayName?: boolean;
  ssr?: boolean;
  fileName?: boolean;
  meaninglessFileNames?: string[];
  minify?: boolean;
  transpileTemplateLiterals?: boolean;
  namespace?: string;
}
