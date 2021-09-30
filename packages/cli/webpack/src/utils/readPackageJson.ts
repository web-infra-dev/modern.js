import { pkgUp } from '@modern-js/utils';

export const readPackageJson = (cwd: string) => {
  const pkg = pkgUp.sync({ cwd });

  return pkg ? require(pkg) : {};
};
