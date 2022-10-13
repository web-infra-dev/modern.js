import path from 'path';
import { resolveBabelConfig } from '@modern-js/server-utils';
import { ModernServerOptions } from '@modern-js/prod-server';
import { fs, getAlias, createDebugger } from '@modern-js/utils';

const debug = createDebugger('server');

const checkDep = (depName: string, paths: string[]) => {
  let packagePath = '';
  try {
    packagePath = require.resolve(depName, {
      paths,
    });
  } catch (error) {}
  return Boolean(packagePath);
};

export const enableRegister = (
  projectRoot: string,
  config: ModernServerOptions['config'],
  // eslint-disable-next-line consistent-return
) => {
  const registerDirs = ['./api', './server', './config/mock', './shared'];
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(projectRoot, TS_CONFIG_FILENAME);
  const isTsProject = fs.existsSync(tsconfigPath);

  const existTsNode = checkDep('ts-node', [projectRoot]);
  const existTsConfigPaths = checkDep('tsconfig-paths', [projectRoot]);

  if (isTsProject && existTsNode && existTsConfigPaths) {
    debug('use ts-node');
    const distPath = config?.output?.path || 'dist';
    const tsNode: typeof import('ts-node') = require('ts-node');
    const tsConfigPaths: typeof import('tsconfig-paths') = require('tsconfig-paths');
    const { alias } = config.source;
    const aliasOption = getAlias(alias || {}, {
      appDirectory: projectRoot,
      tsconfigPath,
    });

    const { paths = {}, absoluteBaseUrl = './' } = aliasOption;

    const tsPaths = Object.keys(paths).reduce((o, key) => {
      let tsPath = paths[key];
      if (typeof tsPath === 'string' && path.isAbsolute(tsPath)) {
        tsPath = path.relative(absoluteBaseUrl, tsPath);
      }
      if (typeof tsPath === 'string') {
        tsPath = [tsPath];
      }
      return {
        ...o,
        [`${key}`]: tsPath,
      };
    }, {});

    tsConfigPaths.register({
      baseUrl: absoluteBaseUrl || './',
      paths: tsPaths,
    });
    tsNode.register({
      project: tsconfigPath,
      // for env.d.ts, https://www.npmjs.com/package/ts-node#missing-types
      files: true,
      transpileOnly: true,
      ignore: ['(?:^|/)node_modules/', `(?:^|/)${distPath}/bundles/`],
    });
  } else {
    debug('use @babel/register');
    const babelConfig = resolveBabelConfig(
      projectRoot,
      {
        ...config.source,
        babelConfig: config.tools.babel,
        server: {
          compiler: config.server.compiler,
        },
      },
      {
        tsconfigPath,
        syntax: 'es6+',
        type: 'commonjs',
      },
    );

    return require('@babel/register')({
      ...babelConfig,
      only: [
        function (filePath: string) {
          // TODO: wait params
          // FIXME: 删除hardcode，根据 AppContext 中的 metaName 设置路径
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
      configFile: false,
      root: projectRoot,
    });
  }
};
