import * as path from 'path';
import { fs, Import, globby, fastGlob, slash } from '@modern-js/utils';
import type { NormalizedConfig, IAppContext } from '@modern-js/core';

const normalizePath: typeof import('normalize-path') = Import.lazy(
  'normalize-path',
  require,
);

export const copyTask = async (option: {
  modernConfig: NormalizedConfig;
  appContext: IAppContext;
}) => {
  const { modernConfig, appContext } = option;
  const { appDirectory } = appContext;
  const {
    output: { copy, path: outputPath = 'dist', jsPath = 'js' },
  } = modernConfig;
  const copyDistDir = path.join(outputPath, jsPath);

  if (!copy) {
    return;
  }
  try {
    // 类型暂时这样处理，待之后优化copy的逻辑
    for (const copyOption of copy as any) {
      // 在原来的基础上，引入了类似于 copy-webpack-plugin 的 context 属性，可以设置项目根路径
      const {
        context = appDirectory,
        from,
        globOptions,
        to: toOrigin,
      } = copyOption;
      let fromOrigin = from;
      // 获取 glob 规则
      let glob = '';
      let options = {};
      if (fromOrigin !== null && typeof fromOrigin === 'object') {
        ({ glob, ...options } = fromOrigin);
        fromOrigin = glob;
      } else if (globOptions && typeof globOptions === 'object') {
        options = globOptions;
      }
      glob = path.isAbsolute(fromOrigin)
        ? fromOrigin
        : path.posix.join(
            fastGlob.escapePath(normalizePath(path.resolve(context))),
            fromOrigin,
          );
      // 计算 glob，获取目标文件
      const paths = await globby(slash(glob), options);
      if (!paths.length) {
        return;
      }
      const to = path.normalize(toOrigin ? toOrigin : '');
      const isToDirectory = path.extname(to) === '';
      paths.forEach(item => {
        const relativeFrom = path.relative(context, item);
        // 如果 to 是目录，通过相对路径计算完整的产物路径；如果 to 是文件，直接作为最终产物路径
        const fileName = isToDirectory ? path.join(to, relativeFrom) : to;
        const finalToPath = path.resolve(copyDistDir, fileName);
        fs.copySync(item, finalToPath);
      });
    }
  } catch (e: any) {
    console.error(`copy error: ${e.message}`);
  }
};
