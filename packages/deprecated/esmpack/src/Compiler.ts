import path from 'path';
import { AsyncParallelHook, AsyncSeriesHook, SyncHook } from 'tapable';
import type { EnvironmentVariables, NormalizedEsmpackOptions } from './Options';
import { Compilation, CompilationParams } from './Compilation';
import { Logger } from './Logger';
import { Cache } from './Cache';

export interface ImportMap {
  imports: { [packageName: string]: string };
}

export interface OutputFile {
  /**
   * Absolute file path
   */
  fileLoc: string;
  compilation: Compilation;
}

interface CompilerHooks {
  environment: SyncHook<EnvironmentVariables>;
  initialize: AsyncParallelHook<Compiler>;
  beforeCompile: AsyncSeriesHook<CompilationParams>;
  compile: SyncHook<CompilationParams>;
  afterCompile: AsyncSeriesHook<Compilation>;
  newCompilation: AsyncSeriesHook<[Compilation, CompilationParams]>;
  compilation: SyncHook<[Compilation, CompilationParams]>;
  make: AsyncParallelHook<Compilation>;
  finishMake: AsyncSeriesHook<Compilation>;
  failed: SyncHook<Error>;
  importMap: SyncHook<[ImportMap, Compilation]>;
}

class Compiler {
  public hooks: CompilerHooks = Object.freeze({
    environment: new SyncHook<EnvironmentVariables>(['envVars']),
    initialize: new AsyncParallelHook<Compiler>(['compiler']),
    beforeCompile: new AsyncSeriesHook<CompilationParams>([
      'compilationParams',
    ]),
    compile: new SyncHook<CompilationParams>(['compilationParams']),
    afterCompile: new AsyncSeriesHook<Compilation>(['compilation']),
    newCompilation: new AsyncSeriesHook<[Compilation, CompilationParams]>([
      'compilation',
      'compilationParams',
    ]),
    compilation: new SyncHook<[Compilation, CompilationParams]>([
      'compilation',
      'compilationParams',
    ]),
    make: new AsyncParallelHook<Compilation>(['compilation']),
    finishMake: new AsyncSeriesHook<Compilation>(['compilation']),
    failed: new SyncHook<Error>(['error']),
    importMap: new SyncHook<[ImportMap, Compilation]>([
      'importMap',
      'compilation',
    ]),
  });

  public cache: Cache = new Cache();

  public logger: Logger = this.getLogger('esmpack.Compiler');

  public importMap: ImportMap = { imports: {} };

  public outputFiles: OutputFile[] = [];

  constructor(public options: NormalizedEsmpackOptions) {}

  async init() {
    /// ///////////
    // env
    /// ///////////
    this.hooks.environment.call(this.options.env);
    await this.hooks.initialize.promise(this);
  }

  async run(params: CompilationParams) {
    try {
      return await this.compile(params);
    } catch (e: any) {
      this.hooks.failed.call(e);
      throw e;
    }
  }

  close() {
    // noop
  }

  private async createCompilation(compilationParams: CompilationParams) {
    const compilation = new Compilation(this, {
      ...compilationParams,
      specifier: compilationParams.specifier || this.options.specifier || '',
      state: compilationParams.state || {},
    });
    return compilation;
  }

  private async newCompilation(compilationParams: CompilationParams) {
    const compilation = await this.createCompilation(compilationParams);
    await this.hooks.newCompilation.promise(compilation, compilationParams);
    this.hooks.compilation.call(compilation, compilationParams);
    await compilation.init();
    return compilation;
  }

  private async compile(params: CompilationParams) {
    const compilationParams = params;
    await this.hooks.beforeCompile.promise(compilationParams);
    this.hooks.compile.call(compilationParams);

    const compilation = await this.newCompilation(compilationParams);

    await this.hooks.make.promise(compilation);
    await this.hooks.finishMake.promise(compilation);

    await compilation.build();
    await compilation.emit();
    await this.hooks.afterCompile.promise(compilation);

    const rollupOutput = compilation.rollupOutput!;
    /**
     * Import map
     */
    const entryChunk = rollupOutput.output.find(
      chunk => 'isEntry' in chunk && chunk.isEntry,
    );
    if (!entryChunk) {
      this.logger.error('entry chunk is not found');
    } else {
      // import map path must be a relative path
      this.importMap.imports[params.specifier] = `./${entryChunk.fileName}`;
      this.hooks.importMap.call(this.importMap, compilation);
    }

    /**
     * Output files
     */
    this.outputFiles = this.outputFiles.concat(
      rollupOutput.output.map(chunk => ({
        fileLoc: path.resolve(compilation.outputOptions.dir!, chunk.fileName),
        compilation,
      })),
    );

    return compilation;
  }

  private getLogger(name: string) {
    return new Logger(name);
  }
}

export { Compiler };
