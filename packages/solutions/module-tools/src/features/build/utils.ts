import * as path from 'path';
import * as os from 'os';
import { Import, chalk } from '@modern-js/utils';
import type {
  IBuildConfig,
  IPackageModeValue,
  JsSyntaxType,
  ITaskMapper,
  ModuleToolsConfig,
} from '../../types';
import type { LoggerText } from './logger';

const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
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

export const getCodeInitMapper = (_: IBuildConfig) => {
  const {
    output: { packageFields, packageMode },
  } = core.useResolvedConfigContext() as ModuleToolsConfig;
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
export const getCodeMapper = ({
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
}) => {
  const { appDirectory } = core.useAppContext();
  const modernConfig = core.useResolvedConfigContext();
  const {
    output: { enableSourceMap, jsPath = 'js', path: distDir = 'dist' },
  } = modernConfig as ModuleToolsConfig;

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

// 获取执行生成 d.ts 的参数
export const getDtsMapper = (config: IBuildConfig, logger: LoggerText) => {
  const { appDirectory } = core.useAppContext();
  const modernConfig = core.useResolvedConfigContext();
  const {
    output: { disableTsChecker, path: outputPath = 'dist' },
  } = modernConfig as ModuleToolsConfig;
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
