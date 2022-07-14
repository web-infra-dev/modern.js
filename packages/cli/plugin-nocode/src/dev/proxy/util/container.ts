import * as path from 'path';
import { fs } from '@modern-js/utils';

const getIsContainer = (pkg: any) =>
  pkg.keywords?.includes('fes-container') &&
  pkg.meta &&
  pkg.meta.contains &&
  pkg.meta.contains.AppContainer;

export const getPageContainerList = () => {
  const pkg = require(path.resolve(process.cwd(), './package.json'));
  if (getIsContainer(pkg)) {
    return {
      name: pkg.name,
      ...pkg.meta,
      pageContainers: Object.keys(pkg.meta.contains)
        .filter(key => key !== 'AppContainer')
        .map(key => ({ key, ...pkg.meta.contains[key] })),
    };
  } else {
    throw new Error();
  }
};

export const isContainer = () => {
  const pkg = require(path.resolve(process.cwd(), './package.json'));
  if (getIsContainer(pkg)) {
    const umdPath = path.resolve(process.cwd(), 'dist/umd/index.js');
    const content = fs.readFileSync(umdPath, 'utf-8');

    return content;
  } else {
    throw new Error();
  }
};
