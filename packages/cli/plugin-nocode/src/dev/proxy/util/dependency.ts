import { fs } from '@modern-js/utils';

export const getDependencyMap = (pkgName: string) => {
  const mapPath = require.resolve(`${pkgName}/dist/umd/index.js.map`);
  if (fs.existsSync(mapPath)) {
    return fs.readFileSync(mapPath, 'utf-8');
  }

  return '';
};
