import * as path from 'path';
import { glob, slash } from '@modern-js/utils';

export default (rootDir: string, entryPath: string) => {
  const stylesPath = path.resolve(rootDir, 'styles');
  const styleFiles = glob.sync(`${stylesPath}/**/*.@(css|less|sass|scss)`);
  return styleFiles.map(p => {
    // glob返回的路径都是符合unix格式运行，需要通过path.join转换为当前系统支持的路径
    const systemPath = path.join(p);
    const realFilePath = path.join(
      path.relative(path.dirname(entryPath), path.dirname(systemPath)),
      path.basename(systemPath),
    );

    return slash(realFilePath);
  });
};
