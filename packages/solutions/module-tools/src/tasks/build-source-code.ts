import { Import, fs } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import type { BabelOptions, IVirtualDist } from '@modern-js/babel-compiler';
import type { ITsconfig } from '../types';

const babelCompiler: typeof import('@modern-js/babel-compiler') = Import.lazy(
  '@modern-js/babel-compiler',
  require,
);
const glob: typeof import('glob') = Import.lazy('glob', require);
const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const bc: typeof import('../utils/babel') = Import.lazy(
  '../utils/babel',
  require,
);
const ts: typeof import('../utils/tsconfig') = Import.lazy(
  '../utils/tsconfig',
  require,
);

export enum Compiler {
  babel,
  esbuild,
  swc,
}

interface IBuildSourceCodeConfig {
  babelConfig: BabelOptions;
  srcRootDir: string;
  willCompilerDirOrFile: string;
  distDir: string;
  compiler: Compiler;
  projectData: {
    appDirectory: string;
  };
  sourceMaps?: boolean;
  tsconfigPath: string;
}

const runBabelCompiler = async (
  willCompilerFiles: string[],
  config: IBuildSourceCodeConfig,
  babelConfig: BabelOptions = {},
) => {
  const { srcRootDir, distDir } = config;
  // TODO: 判断lynx模式下，修改distFileExtMap: {'js': 'js', 'jsx': 'jsx', 'ts': 'js', 'tsx': 'jsx'}
  return babelCompiler.compiler(
    {
      quiet: true,
      enableVirtualDist: true,
      rootDir: srcRootDir,
      filenames: willCompilerFiles,
      distDir,
    },
    babelConfig,
  );
};

export const getWillCompilerCode = (
  srcDirOrFile: string,
  option: { tsconfig: ITsconfig | null; isTsProject: boolean },
) => {
  const { tsconfig, isTsProject } = option;
  // 如果是一个文件路径，则直接返回
  if (fs.existsSync(srcDirOrFile) && fs.lstatSync(srcDirOrFile).isFile()) {
    return [srcDirOrFile];
  }

  const getExts = (isTs: boolean) => {
    // TODO: 是否受控tsconfig.json 里的jsx配置
    let exts = [];
    if (isTs) {
      exts = tsconfig?.compilerOptions?.allowJs
        ? ['.ts', '.tsx', '.js', '.jsx']
        : ['.ts', '.tsx'];
    } else {
      exts = ['.js', '.jsx'];
    }

    return exts;
  };

  const exts = getExts(isTsProject);
  const globPattern = `${srcDirOrFile}/**/*{${exts.join(',')}}`;
  const files = glob.sync(globPattern, {
    ignore: [`${srcDirOrFile}/**/*.d.ts`],
  });

  return files;
};

export const buildSourceCode = async (config: IBuildSourceCodeConfig) => {
  const {
    compiler,
    willCompilerDirOrFile,
    tsconfigPath,
    sourceMaps,
    babelConfig,
  } = config;
  const tsconfig = ts.readTsConfig(tsconfigPath);
  const willCompilerFiles = getWillCompilerCode(willCompilerDirOrFile, {
    tsconfig,
    isTsProject: Boolean(tsconfig),
  });

  let distSet = null;
  if (compiler === Compiler.babel) {
    distSet = await runBabelCompiler(willCompilerFiles, config, {
      ...babelConfig,
      sourceMaps,
    });
  } else {
    distSet = {
      code: 1,
      message: 'no compiler',
    };
  }

  return distSet;
};

const generatorRealFiles = (virtualDists: IVirtualDist[]) => {
  for (const virtualDist of virtualDists) {
    const { distPath, code, sourcemap, sourceMapPath } = virtualDist;
    fs.ensureFileSync(distPath);
    fs.writeFileSync(distPath, code);
    if (sourcemap.length > 0) {
      fs.ensureFileSync(sourceMapPath);
      fs.writeFileSync(sourceMapPath, sourcemap);
    }
  }
};

export const initEnv = ({ syntax, type }: ITaskConfig) => {
  if (syntax === 'es6+' && type === 'commonjs') {
    return 'nodejs';
  } else if (syntax === 'es6+' && type === 'module') {
    return 'modern';
  } else if (syntax === 'es5' && type === 'module') {
    return 'legacy-browser';
  }

  return '';
};

interface ITaskConfig {
  srcRootDir: string; // 源码的根目录
  willCompilerDirOrFile: string; // 用于编译的源码文件或者源码目录
  distDir: string;
  appDirectory: string;
  sourceMaps: boolean;
  syntax: 'es5' | 'es6+';
  type: 'module' | 'commonjs';
  tsconfigPath: string;
  copyDirs?: string;
  compiler?: 'babel' | 'esbuild' | 'swc';
  watch: boolean;
}
const defaultConfig: ITaskConfig = {
  srcRootDir: `${process.cwd()}/src`,
  willCompilerDirOrFile: `${process.cwd()}/src`,
  distDir: './dist/js/temp',
  compiler: 'babel',
  appDirectory: '',
  sourceMaps: false,
  tsconfigPath: '',
  syntax: 'es5',
  type: 'module',
  watch: false,
};
const taskMain = async ({
  modernConfig,
}: {
  modernConfig: NormalizedConfig;
}) => {
  // 执行脚本的参数处理和相关需要配置的获取
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<ITaskConfig>(defaultConfig);
  // process.env.BUILD_MODE = initEnv(config);
  const compiler = Compiler.babel; // 目前暂时只支持 babel
  const babelConfig = bc.resolveBabelConfig(config.appDirectory, modernConfig, {
    sourceAbsDir: config.srcRootDir,
    tsconfigPath: config.tsconfigPath,
    syntax: config.syntax,
    type: config.type,
  });

  const {
    code,
    message,
    messageDetails,
    virtualDists = [],
  } = await buildSourceCode({
    distDir: config.distDir,
    srcRootDir: config.srcRootDir,
    willCompilerDirOrFile: config.willCompilerDirOrFile,
    sourceMaps: config.sourceMaps,
    compiler,
    projectData: { appDirectory: config.appDirectory },
    tsconfigPath: config.tsconfigPath,
    babelConfig,
  });

  if (code === 0) {
    generatorRealFiles(virtualDists);
    // 执行成功log使用 console.info
    console.info('[Babel Compiler]: Successfully');
  } else if (messageDetails && messageDetails.length > 0) {
    console.error(message);
    for (const detail of messageDetails || []) {
      console.error(detail.content);
    }
  }

  if (code === 0 && config.copyDirs) {
    const copyList = config.copyDirs.split(',');
    for (const copyDir of copyList) {
      fs.ensureDirSync(copyDir);
      fs.copySync(config.distDir, copyDir);
    }
  }
};

(async () => {
  const { resolved } = await core.cli.init();
  await core.manager.run(async () => {
    try {
      await taskMain({ modernConfig: resolved });
    } catch (e) {
      console.error(e);
    }
  });
})();
