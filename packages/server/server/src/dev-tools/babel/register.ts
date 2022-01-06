import path from 'path';
import { resolveBabelConfig } from '@modern-js/server-utils';
import { ModernServerOptions } from '../../type';

const registerDirs = ['./api', './server', './config/mock', './shared'];

export const enableRegister = (
  projectRoot: string,
  config: ModernServerOptions['config'],
) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(projectRoot, TS_CONFIG_FILENAME);

  const babelConfig = resolveBabelConfig(projectRoot, config, {
    tsconfigPath,
    syntax: 'es6+',
    type: 'commonjs',
  });

  return require('@babel/register')({
    ...babelConfig,
    only: [
      function (filePath: string) {
        // TODO: wait params
        if (filePath.includes(`node_modules${path.sep}.modern-js`)) {
          return true;
        }
        return registerDirs.some(registerDir =>
          filePath.startsWith(path.join(projectRoot, registerDir)),
        );
      },
    ],
    extensions: ['.js', '.ts'],
    babelrc: false,
    root: projectRoot,
  });
};
