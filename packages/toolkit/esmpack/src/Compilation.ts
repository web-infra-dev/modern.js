import path from 'path';
import { AsyncSeriesHook, SyncHook } from 'tapable';
import { rollup } from 'rollup';
import { cloneDeep } from '@modern-js/utils/lodash';
import type {
  Plugin as RollupPlugin,
  RollupBuild,
  RollupError,
  RollupOutput,
} from 'rollup';
import rollupPluginReplace from '@rollup/plugin-replace';
import rollupPluginCommonjs, {
  RollupCommonJSOptions,
} from '@rollup/plugin-commonjs';
import { wasm as rollupPluginWasm } from '@rollup/plugin-wasm';
import rollupPluginJson from '@rollup/plugin-json';
import type { RollupJsonOptions } from '@rollup/plugin-json';
import rollupPluginNodeResolve from '@rollup/plugin-node-resolve';
import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve';
import rollupPluginSvgr from '@svgr/rollup';
import rollupPluginUrl from '@rollup/plugin-url';
import type {
  EntryInput,
  InputOptions,
  OutputOptions,
} from './CompilerOptions';
import { Logger } from './Logger';
import { rollupPluginCatchFetch } from './rollup-plugins/rollup-plugin-catch-fetch';
import { rollupPluginStripSourceMapping } from './rollup-plugins/rollup-plugin-strip-source-mapping';
import {
  rollupPluginCatchUnresolvedPluginName,
  rollupPluginCatchUnresolved,
} from './rollup-plugins/rollup-plugin-catch-unresolved';
import { Compiler } from './Compiler';
import {
  LessOptions,
  rollupPluginLess,
} from './rollup-plugins/rollup-plugin-less';
import {
  rollupPluginScss,
  ScssOptions,
} from './rollup-plugins/rollup-plugin-scss';
import { rollupPluginCss } from './rollup-plugins/rollup-plugin-css';
import {
  rollupPluginNodePolyfills,
  NodePolyfillsOptions,
} from './rollup-plugins/rollup-plugin-node-polyfills';
import { getEntryFilename } from './utils/package';
import { getRollupReplaceKeys } from './utils/env';
import { EnvironmentVariables } from './Options';
import { rollupPluginCJSNamedExportDetect } from './rollup-plugins/rollup-plugin-cjs-named-export-detect';

export interface CompilationParams {
  specifier: string;
  importer?: string | null;
  inlineDependency?: (id: string) => boolean;
  /**
   * user defined state
   */
  state?: Record<string, any>;
}

export interface DependencyInfo {
  specifier: string;
  importer?: string;
}

interface CompilationHooks {
  environment: SyncHook<EnvironmentVariables>;
  initialize: AsyncSeriesHook<Compilation>;
  inputOptions: AsyncSeriesHook<InputOptions>;
  outputOptions: AsyncSeriesHook<OutputOptions>;
  rollupPluginOptions: {
    nodeResolve: SyncHook<RollupNodeResolveOptions>;
    json: SyncHook<RollupJsonOptions>;
    less: SyncHook<LessOptions>;
    scss: SyncHook<ScssOptions>;
    commonjs: SyncHook<RollupCommonJSOptions>;
    nodePolyfills: SyncHook<NodePolyfillsOptions>;
  };
  rollupPlugins: AsyncSeriesHook<{
    preRollupPlugins: RollupPlugin[];
    rollupPlugins: RollupPlugin[];
    postRollupPlugins: RollupPlugin[];
  }>;
}

class Compilation {
  public hooks: CompilationHooks = Object.freeze({
    environment: new SyncHook<EnvironmentVariables>(['environment']),
    initialize: new AsyncSeriesHook<Compilation>(['compilation']),
    inputOptions: new AsyncSeriesHook<InputOptions>(['inputOptions']),
    outputOptions: new AsyncSeriesHook<OutputOptions>(['outputOptions']),
    rollupPluginOptions: {
      nodeResolve: new SyncHook<RollupNodeResolveOptions>([
        'nodeResolveOptions',
      ]),
      json: new SyncHook<RollupJsonOptions>(['jsonOptions']),
      less: new SyncHook<LessOptions>(['lessOptions']),
      scss: new SyncHook<ScssOptions>(['scssOptions']),
      commonjs: new SyncHook<RollupCommonJSOptions>(['commonjsOptions']),
      nodePolyfills: new SyncHook<NodePolyfillsOptions>([
        'nodePolyfillsOptions',
      ]),
    },
    rollupPlugins: new AsyncSeriesHook<{
      preRollupPlugins: RollupPlugin[];
      rollupPlugins: RollupPlugin[];
      postRollupPlugins: RollupPlugin[];
    }>(['rollupPlugins']),
  });

  public logger: Logger = this.getLogger('esmpack.Compilation');

  public specifier: string;

  public importer: string | null = null;

  public inlineDependency: (id: string) => boolean;

  /**
   * Path in file system when specifier resolved
   * It can be passed as importer for nested dependencies
   * @default null
   */
  public specifierFilePath: string | null = null;

  public manifest: any | null = null;

  public inputOptions: InputOptions = {};

  public outputOptions: OutputOptions = {};

  public rollupBuild: RollupBuild | null = null;

  public rollupOutput: RollupOutput | null = null;

  public dependencies: DependencyInfo[] = [];

  private preRollupPlugins: RollupPlugin[] = [];

  private readonly rollupPlugins: RollupPlugin[] = [];

  private postRollupPlugins: RollupPlugin[] = [];

  private inited: boolean = false;

  private readonly env: EnvironmentVariables;

  private state: Record<string, any>;

  constructor(public compiler: Compiler, compilationParams: CompilationParams) {
    this.specifier = compilationParams.specifier;
    this.importer = compilationParams.importer || null;
    this.state = compilationParams.state || {};
    this.inlineDependency = compilationParams.inlineDependency || (() => false);
    this.env = cloneDeep(compiler.options.env);
  }

  public async init() {
    this.hooks.environment.call(this.env);
    await this.hooks.initialize.promise(this);
    await this.initInputOptions();
    await this.initOutputOptions();
    this.inited = true;
  }

  public setState(key: string, value: string) {
    this.state[key] = value;
  }

  public getState(key: string) {
    return this.state[key];
  }

  private async initInputOptions() {
    this.inputOptions.onwarn = this.onwarn;
    this.inputOptions.treeshake = false;
    await this.initPlugins();
    await this.hooks.inputOptions.promise(this.inputOptions);
  }

  private readonly onwarn: NonNullable<InputOptions['onwarn']> = (
    warning,
    warn,
  ) => {
    // Warn about the first circular dependency, but then ignore the rest.
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      this.logger.silly(
        `Warning: 1+ circular dependencies found via "${
          warning.importer || ''
        }".`,
      );
      return;
    }
    // TODO: sometime this is injected by helper function, in those cases, this should be safe and ignored
    if (warning.code === 'THIS_IS_UNDEFINED') {
      this.logger.silly(
        `Warning: ${warning.message}${warning.id ? ` (${warning.id})` : ''}`,
      );
      return;
    }
    if (warning.code === 'EVAL') {
      this.logger.silly(
        `Warning: ${warning.message}${warning.id ? ` (${warning.id})` : ''}`,
      );
      return;
    }
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
      this.logger.silly(
        `Warning: ${warning.message}${warning.id ? ` (${warning.id})` : ''}`,
      );
      return;
    }
    // Log "unresolved" import warnings as an error, causing Snowpack to fail at the end.
    if (
      warning.code === 'PLUGIN_WARNING' &&
      warning.plugin === rollupPluginCatchUnresolvedPluginName
    ) {
      // Display posix-style on all environments, mainly to help with CI :)
      let msg = `${warning.message}`;
      if (warning.id) {
        msg = `${warning.id}: ${msg}`;
      }
      this.logger.error(msg);
      throw new Error(msg);
    }
    warn(warning);
  };

  private async initOutputOptions() {
    this.outputOptions = {
      dir: this.compiler.options.outDir,
      format: 'es',
      sourcemap: false,
      exports: 'named',
      chunkFileNames: '/_chunk_/[name]-[hash].js',
      entryFileNames: chunk => {
        // output in true node_modules level
        // avoid overwritten by different version
        const { specifier, specifierFilePath } = this;
        const specReg = new RegExp(`/node_modules/(.+)/${specifier}`);
        const match = specifierFilePath?.match(specReg);
        const prefix = match?.[1] || '';
        const filename = getEntryFilename(chunk.name);

        return path.join(prefix, filename);
      },
    };
    await this.hooks.outputOptions.promise(this.outputOptions);
  }

  private getLogger(name: string) {
    return new Logger(name);
  }

  async addInput(entryInput: EntryInput, manifest: any) {
    if (!this.inited) {
      const msg = 'init should be called';
      this.logger.error(msg);
      throw new Error(msg);
    }
    this.inputOptions.input = {
      ...this.inputOptions.input,
      ...entryInput,
    };
    this.manifest = manifest;
  }

  async addDependency(specifier: string, importer?: string) {
    const ignoreThisAdd = this.dependencies.some(x => {
      /**
       * 1. specifier 必须相同
       * 2. importer 相同，或者 importer 传入的是 undefined
       */
      const ret =
        x.specifier === specifier && (x.importer === importer || !importer);
      return ret;
    });
    if (!ignoreThisAdd) {
      this.dependencies.push({
        specifier,
        importer,
      });
    }
  }

  async build() {
    try {
      const lastCWD = process.cwd();
      // rollup depends on process.cwd... some one fix this plz.
      process.chdir(this.compiler.options.cwd);

      this.rollupBuild = await rollup(this.inputOptions);
      process.chdir(lastCWD);
    } catch (_err: any) {
      const err: RollupError = _err;
      const errFilePath = err.loc?.file || err.id;
      if (!errFilePath) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw err;
      }
      const suggestion = err.message;
      // Display posix-style on all environments, mainly to help with CI :)
      const fileName = errFilePath
        .replace(this.compiler.options.cwd + path.sep, '')
        .replace(/\\/g, '/');
      let errMsg = `failed to load ${fileName}\n  ${suggestion}`;
      if (err.plugin) {
        errMsg += `\n  by ${err.plugin}`;
      }
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  async emit() {
    if (!this.rollupBuild) {
      const errMsg = 'Missing Rollup rollupBuild';
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
    try {
      this.rollupOutput = await this.rollupBuild.write(this.outputOptions);
      await this.rollupBuild.close();
    } catch (e: any) {
      this.logger.error(e);
      throw e;
    }
  }

  private initPrePlugins() {
    this.preRollupPlugins = [
      rollupPluginReplace(getRollupReplaceKeys(this.env)),
      rollupPluginCatchFetch(),
      rollupPluginCJSNamedExportDetect(),
    ];
  }

  private initPostPlugins() {
    this.postRollupPlugins = [
      rollupPluginCatchUnresolved(),
      rollupPluginStripSourceMapping(),
    ];
  }

  private async initPlugins() {
    const { cwd } = this.compiler.options;

    this.initPrePlugins();
    this.initPostPlugins();
    /**
     * Node Resolve
     */
    const nodeResolveOptions = {
      mainFields: ['exports', 'browser:module', 'browser', 'module', 'main'],
      extensions: ['.mjs', '.cjs', '.js', '.json', '.jsx'], // Default: [ '.mjs', '.js', '.json', '.node' ]
      // whether to prefer built-in modules (e.g. `fs`, `path`) or local ones with the same names
      preferBuiltins: true, // Default: true
      dedupe: [], // userDefinedRollup.dedupe,
    };
    this.hooks.rollupPluginOptions.nodeResolve.call(nodeResolveOptions);
    this.rollupPlugins.push(rollupPluginNodeResolve(nodeResolveOptions));

    /**
     * JSON
     */
    const jsonOptions = {
      preferConst: true,
      indent: '  ',
      compact: false,
      namedExports: true,
    };
    this.hooks.rollupPluginOptions.json.call(jsonOptions);
    this.rollupPlugins.push(rollupPluginJson(jsonOptions));

    /**
     * Wasm
     */
    this.rollupPlugins.push(rollupPluginWasm());

    /**
     * Less
     */
    const lessOptions: LessOptions = {
      paths: [path.resolve(cwd, 'node_modules')],
    };
    this.hooks.rollupPluginOptions.less.call(lessOptions);
    this.rollupPlugins.push(rollupPluginLess(lessOptions));

    /**
     * SCSS
     */
    const scssOptions: ScssOptions = {
      includePaths: [path.resolve(cwd, 'node_modules')],
    };
    this.hooks.rollupPluginOptions.scss.call(scssOptions);
    this.rollupPlugins.push(rollupPluginScss(scssOptions));

    /**
     * CSS
     */
    this.rollupPlugins.push(rollupPluginCss(cwd));

    /**
     * SVG
     */
    this.rollupPlugins.push(rollupPluginUrl());
    this.rollupPlugins.push(rollupPluginSvgr() as any);

    /**
     * CommonJS
     */
    const commonjsOptions: RollupCommonJSOptions = {
      transformMixedEsModules: true,
      extensions: ['.js', '.cjs'],
      requireReturnsDefault: 'auto',
      sourceMap: false,
    };
    this.hooks.rollupPluginOptions.commonjs.call(commonjsOptions);
    this.rollupPlugins.push(rollupPluginCommonjs(commonjsOptions));

    /**
     * NodePolyfills
     */
    const nodePolyfillsOptions: NodePolyfillsOptions = {
      sourceMap: false,
    };
    this.hooks.rollupPluginOptions.nodePolyfills.call(nodePolyfillsOptions);
    this.rollupPlugins.push(rollupPluginNodePolyfills(nodePolyfillsOptions));

    await this.hooks.rollupPlugins.promise({
      preRollupPlugins: this.preRollupPlugins,
      rollupPlugins: this.rollupPlugins,
      postRollupPlugins: this.postRollupPlugins,
    });

    const finalPlugins = [
      ...this.preRollupPlugins,
      ...this.rollupPlugins,
      ...this.postRollupPlugins,
    ];

    this.inputOptions.plugins = finalPlugins;
    this.outputOptions.plugins = finalPlugins;
  }
}

export { Compilation };
