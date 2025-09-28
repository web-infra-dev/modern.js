import path from 'path';
import { fs } from '@modern-js/utils';

/**
 * Get package name from package.json file
 * @param appDirectory - Application directory path
 * @returns Package name or undefined if not found
 */
const getPackageName = (appDirectory: string): string | undefined => {
  try {
    const packageJsonPath = path.resolve(appDirectory, './package.json');
    const packageJson = require(packageJsonPath);
    return packageJson.name;
  } catch (error) {
    // If package.json doesn't exist or is invalid, return undefined
    return undefined;
  }
};

async function runtimeGenerator({
  runtime,
  appDirectory,
  relativeDistPath,
  packageName,
}: {
  runtime: string;
  appDirectory: string;
  relativeDistPath: string;
  packageName?: string;
}) {
  const pluginDir = path.resolve(
    appDirectory,
    `./${relativeDistPath}`,
    'runtime',
  );

  const requestId =
    packageName ||
    getPackageName(appDirectory) ||
    process.env.npm_package_name ||
    'default';

  const source = `import { configure as _configure } from '${runtime}'
    const configure = (options) => {
      return _configure({
        ...options,
        requestId: '${requestId}',
      });
    }
    export { configure }
  `;
  const pluginPath = path.join(pluginDir, 'index.js');
  await fs.ensureFile(pluginPath);
  await fs.writeFile(pluginPath, source);

  const tsSource = `type IOptions<F = typeof fetch> = {
    request?: F;
    interceptor?: (request: F) => F;
    allowedHeaders?: string[];
    setDomain?: (ops?: {
      target: 'node' | 'browser';
      requestId: string;
    }) => string;
    requestId?: string;
  };
  export declare const configure: (options: IOptions) => void;`;
  const pluginTypePath = path.join(pluginDir, 'index.d.ts');
  await fs.ensureFile(pluginTypePath);
  await fs.writeFile(pluginTypePath, tsSource);
}

export default runtimeGenerator;
