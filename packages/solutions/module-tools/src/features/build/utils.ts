import * as path from 'path';
import * as os from 'os';
import { Import, chalk } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type {
  IBuildConfig,
  IPackageModeValue,
  JsSyntaxType,
  ITaskMapper,
  TaskBuildConfig,
  BuildConfig,
  BuildPreset,
} from '../../types';
import type { LoggerText } from './logger';

const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);

// 硬解字符串返回相应格式的对象
const updateMapper = (
  packageFieldValue: JsSyntaxType,
  outDir: IPackageModeValue['outDir'],
  mapper: IPackageModeValue[],
): IPackageModeValue[] => {
  if (packageFieldValue === 'CJS+ES6') {
    return [...mapper, { type: 'commonjs', syntax: 'es6+', outDir }];
  } else if (packageFieldValue === 'ESM+ES5') {
    return [...mapper, { type: 'module', syntax: 'es5', outDir }];
  } else if (packageFieldValue === 'ESM+ES6') {
    return [...mapper, { type: 'module', syntax: 'es6+', outDir }];
  } else {
    return [...mapper];
  }
};

export const getCodeInitMapper = (api: PluginAPI, _: IBuildConfig) => {
  const {
    output: { packageFields, packageMode },
  } = api.useResolvedConfigContext();
  let initMapper: IPackageModeValue[] = [];

  // 如果不存在packageFields配置或者packageFields为空对象，则使用 packageMode
  if (
    !packageFields ||
    (typeof packageFields === 'object' &&
      Object.keys(packageFields).length === 0)
  ) {
    initMapper =
      constants.PACKAGE_MODES[packageMode || constants.DEFAULT_PACKAGE_MODE];
  } else if (packageFields && Object.keys(packageFields).length > 0) {
    if (packageFields.modern) {
      initMapper = updateMapper(packageFields.modern, 'modern', initMapper);
    }

    if (packageFields.main) {
      initMapper = updateMapper(packageFields.main, 'node', initMapper);
    }

    if (packageFields.module) {
      initMapper = updateMapper(
        packageFields.module,
        'treeshaking',
        initMapper,
      );
    }

    // TODO: 如果存在其他配置，需要提示
    if (!packageFields.modern && !packageFields.main && !packageFields.module) {
      console.error(
        chalk.red(
          `Unrecognized ${JSON.stringify(
            packageFields,
          )} configuration, please use keys: 'modern, main, jupiter:modern' and use values: 'CJS+ES6, ESM+ES5, ESM+ES6'`,
        ),
      );

      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  return initMapper;
};

// 获取执行构建源码的参数
export const getCodeMapper = (
  api: PluginAPI,
  {
    logger,
    taskPath,
    config,
    initMapper,
    srcRootDir,
    willCompilerDirOrFile,
  }: ITaskMapper & {
    config: IBuildConfig;
    initMapper: IPackageModeValue[];
    srcRootDir: string;
    willCompilerDirOrFile: string;
  },
) => {
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { enableSourceMap, jsPath = 'js', path: distDir = 'dist' },
  } = modernConfig;

  const { tsconfigName = 'tsconfig.json' } = config;
  const tsconfigPath = path.join(appDirectory, tsconfigName);

  return initMapper.map(option => {
    // 不是output.copy配置，而是内部的js copy逻辑
    const copyDirs = option.copyDirs?.map(copyDir =>
      path.join(appDirectory, `./${distDir}/${jsPath}/${copyDir}`),
    );
    return {
      logger,
      taskPath,
      params: [
        `--syntax=${option.syntax}`,
        `--type=${option.type}`,
        `--srcRootDir=${srcRootDir}`,
        `--willCompilerDirOrFile=${willCompilerDirOrFile}`,
        copyDirs ? `--copyDirs=${copyDirs.join(',')}` : '',
        `--distDir=${path.join(
          appDirectory,
          `./${distDir}/${jsPath}/${option.outDir}`,
        )}`,
        `--appDirectory=${appDirectory}`,
        enableSourceMap ? '--sourceMaps' : '',
        `--tsconfigPath=${tsconfigPath}`,
      ],
    };
  });
};

// 获取执行speedy bundler的参数
export const getBundlerMapper = (
  api: PluginAPI,
  config: TaskBuildConfig,
  logger: LoggerText,
) => {
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: outputPath = 'dist' },
  } = modernConfig;
  const { enableWatchMode, target, format, entry } = config;

  return format.map(val => {
    return {
      logger,
      taskPath: require.resolve('../../tasks/speedy'),
      params: [
        `--distDir=${path.join(appDirectory, `./${outputPath}/${val}`)}`,
        `--appDirectory=${appDirectory}`,
        enableWatchMode ? `--watch` : '',
        `--target=${target}`,
        `--format=${val}`,
        `--entry=${entry}`,
      ],
    }
  });
};

export const getDtsBundlerMapper = (
  api: PluginAPI,
  config: TaskBuildConfig,
  logger: LoggerText,
) => {
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: outputPath = 'dist' },
  } = modernConfig;
  const { tsconfigName = 'tsconfig.json', enableWatchMode } = config;
  const tsconfigPath = path.join(appDirectory, tsconfigName);
  return [
    {
      logger,
      taskPath: require.resolve('../../tasks/dts-bundle'),
      params: [
        `--distDir=${path.join(appDirectory, `./${outputPath}/bundle`)}`,
        `--tsconfigPath=${tsconfigPath}`,
        enableWatchMode ? `--watch` : '',
        `--appDirectory=${appDirectory}`,
      ],
    },
  ];
};

export const getRollupMapper = (
  api: PluginAPI,
  config: TaskBuildConfig,
  logger: LoggerText,
) => {
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: outputPath = 'dist' },
  } = modernConfig;
  const { tsconfigName = 'tsconfig.json', enableWatchMode, entry } = config;
  const tsconfigPath = path.join(appDirectory, tsconfigName);
  return [
    {
      logger,
      taskPath: require.resolve('../../tasks/rollup'),
      params: [
        `--distDir=${path.join(appDirectory, `./${outputPath}/types`)}`,
        `--tsconfigPath=${tsconfigPath}`,
        enableWatchMode ? `--watch` : '',
        `--entry=${entry}`,
      ],
    },
  ];
};

// 获取执行生成 d.ts 的参数
export const getDtsMapper = (
  api: PluginAPI,
  config: IBuildConfig,
  logger: LoggerText,
) => {
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { disableTsChecker, path: outputPath = 'dist' },
  } = modernConfig;
  const { tsconfigName = 'tsconfig.json', enableWatchMode, sourceDir } = config;
  const srcDir = path.join(appDirectory, './src');
  const tsconfigPath = path.join(appDirectory, tsconfigName);
  return [
    {
      logger,
      taskPath: require.resolve('../../tasks/generator-dts'),
      params: [
        `--srcDir=${srcDir}`,
        `--distDir=${path.join(appDirectory, `./${outputPath}/types`)}`,
        `--appDirectory=${appDirectory}`,
        `--tsconfigPath=${tsconfigPath}`,
        `--sourceDirName=${sourceDir}`,
        enableWatchMode ? `--watch` : '',
        disableTsChecker ? '' : `--tsCheck`,
      ],
    },
  ];
};

/**
 * 处理日志信息
 */
export class LogStack {
  private _codeLogStack: string[];

  constructor() {
    this._codeLogStack = [];
  }

  update(latestLog: string, { splitEOL = false } = {}) {
    if (splitEOL) {
      latestLog.split(os.EOL).forEach(log => {
        this._codeLogStack.unshift(log.trim());
      });
      return;
    }

    this._codeLogStack.unshift(latestLog.trim());
  }

  clear() {
    this._codeLogStack = [];
  }

  get value() {
    return [...new Set(this._codeLogStack)];
  }
}

export const logTemplate = (
  title: string,
  messageStack: string[],
  maxLength: number,
  {
    noBottomBorder = false,
    bottomBorderText = '',
    noLeftBorder = false,
    leftBorder = '│',
    contentColor = (s: string) => s,
  } = {},
) => {
  const leftBorderFlag = noLeftBorder ? '' : leftBorder;
  const messageFragments = messageStack
    .map(p => {
      p.trim();

      return `${leftBorderFlag}${p.replace(constants.clearFlag, '')}`;
    }) // 移除 clearFlag
    .slice(0, maxLength) // 控制长度
    .filter(s => s !== leftBorderFlag) // 过滤空字符串
    .reverse(); // 调换顺序，最新的消息在最后面
  const template = `${title}:
${contentColor(messageFragments.join(os.EOL))}${
    noBottomBorder ? '' : `\n${bottomBorderText}`
  }`;
  return template;
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TimeCounter {
  static _now: number;

  static time() {
    this._now = Date.now();
  }

  static timeEnd() {
    const span = Date.now() - this._now;
    return span < 1000 ? `${span}ms` : `${(span / 1000).toFixed(2)}s`;
  }
}
export const normalizeModuleConfig = (preset?: BuildPreset): Required<BuildConfig>[] => {
  if (preset === 'library') {
    return constants.defaultLibraryPreset;
  } else if (preset === 'component') {
    return constants.defaultComponentPreset;
  }
  //FIXME:throw error when preset is empty array or empty object
  const presetArray = Array.isArray(preset) ? (preset.length === 0 ? constants.defaultLibraryPreset : preset) : (preset ? [preset] : constants.defaultLibraryPreset);
  const normalizedModule = presetArray.map(config => {
    const format = config.format ?? ['esm', 'cjs'];
    const target = config.target ?? 'esnext';
    const bundle = config.bundle ?? true;
    const entry = config.entry ?? 'src/index.ts';
    const speedyOptions = config.speedyOptions ?? {};
    const watch = config.watch ?? false;
    const tsconfig = config.tsconfig ?? 'tsconfig.json';
    const dts = config.dts ?? true;
    return {
      format,
      target,
      bundle,
      entry,
      speedyOptions,
      watch,
      tsconfig,
      dts
    };
  });
  return normalizedModule;
};
