import path from 'path';
import { fs } from '@modern-js/utils';

const { resolve } = path;

const umdFilePath = (folder: string) => resolve(folder, 'dist/umd/index.js');
const pkgFilePath = (folder: string) => resolve(folder, 'package.json');

const getDeps = (cwd: string) => {
  const packageJson = JSON.parse(
    fs.readFileSync(resolve(cwd, 'package.json'), 'utf-8'),
  );
  const deps = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ];
  return deps;
};

const getSource = (ret = {}, name: string) => {
  const folder = path.dirname(require.resolve(`${name}/package.json`));
  const pkg = require(pkgFilePath(folder));
  if (!pkg.isDataSource) {
    return ret;
  }

  const umdpath = umdFilePath(folder);

  if (!fs.existsSync(umdpath)) {
    return ret;
  }

  // const content = fs.readFileSync(umdpath, 'utf-8');

  return {
    ...ret,
    [name]: {},
  };
};

export const getLocalDataSources = () => {
  const cwd = process.cwd();
  const deps = getDeps(cwd);

  return deps.reduce(getSource, {});
};
