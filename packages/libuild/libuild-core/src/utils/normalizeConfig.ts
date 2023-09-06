import path from 'path';
import { createLogger } from '../logger';
import { DEFAULT_OUTBASE, DEFAULT_OUTDIR } from '../constants/config';
import { createResolver, cssExtensions, jsExtensions } from '../core/resolve';
import { CLIConfig, BuildConfig, LibuildPlugin, ResolveNormalized } from '../types';

export async function normalizeConfig(config: CLIConfig): Promise<BuildConfig> {
  const root = config.root ?? process.cwd();
  const input = config.input ?? {
    index: path.resolve(root, './src/index.ts'),
  };
  const plugins: LibuildPlugin[] = config.plugins ?? [];
  const logLevel = config.logLevel ?? 'info';
  const logger = createLogger({ level: logLevel });
  const platform = config.platform ?? 'node';
  const defaultMainFields = platform === 'node' ? ['module', 'main'] : ['module', 'browser', 'main'];
  const resolve: ResolveNormalized = {
    alias: config.resolve?.alias ?? {},
    mainFiles: config.resolve?.mainFiles ?? ['index'],
    mainFields: config.resolve?.mainFields ?? defaultMainFields,
    preferRelative: config.resolve?.preferRelative ?? false,
  };
  const sourceMap = config.sourceMap ?? false;
  const target = config.target ?? 'es2015';

  const globals = config.globals ?? {};

  const define = {
    ...config.define,
  };

  const watch = config.watch ?? false;
  const autoExternal = config.autoExternal ?? true;
  const external = [
    ...(config.external ?? []),
  ];
  const bundle = config.bundle ?? true;
  const metafile = config.metafile ?? false;
  const style = config.style ?? {};
  const loader = config.loader ?? {};
  const inject = config.inject ?? [];
  const format = config.format ?? 'esm';
  const asset = {
    limit: config.asset?.limit ?? 0,
    outdir: config.asset?.outdir ?? 'assets',
    rebase: config.asset?.rebase ?? (format === 'esm' || format === 'cjs'),
    name: config.asset?.name ?? '[name].[hash].[ext]',
    publicPath: config.asset?.publicPath ?? '',
  };
  const minify = config.minify ?? false;
  const splitting = config.splitting ?? false;
  const outdir = path.resolve(root, config.outdir ?? DEFAULT_OUTDIR);
  const outbase = path.resolve(root, config.outbase ?? DEFAULT_OUTBASE);

  const sourceDir = path.resolve(root, config.sourceDir ?? 'src');
  const entryNames = config.entryNames ?? (bundle ? '[name]' : '[dir]/[name]');
  const { chunkNames } = config;
  const jsx = config.jsx ?? 'automatic';
  const esbuildOptions = config.esbuildOptions ?? ((config) => config);
  const redirect = {
    alias: config.redirect?.alias ?? true,
    style: config.redirect?.style ?? true,
    asset: config.redirect?.asset ?? true,
  };
  const transformCache = config.transformCache ?? true;

  return {
    transformCache,
    redirect,
    esbuildOptions,
    jsx,
    chunkNames,
    inject,
    loader,
    metafile,
    bundle,
    style,
    root,
    resolve,
    logLevel,
    logger,
    plugins,
    target,
    define,
    sourceMap,
    node_resolve: createResolver({
      resolveType: 'js',
      root,
      ...resolve,
      platform,
      extensions: jsExtensions,
    }),
    css_resolve: createResolver({
      resolveType: 'css',
      root,
      ...resolve,
      platform,
      preferRelative: true,
      extensions: cssExtensions,
    }),
    input,
    globals,
    watch,
    outdir,
    outbase,
    sourceDir,
    minify,
    splitting,
    entryNames,
    format,
    external,
    platform,
    asset,
    autoExternal,
    sideEffects: config.sideEffects,
  };
}
