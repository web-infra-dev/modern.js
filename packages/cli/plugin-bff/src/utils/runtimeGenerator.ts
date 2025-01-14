import path from 'path';
import { fs } from '@modern-js/utils';

async function runtimeGenerator({
  runtime,
  appDirectory,
  relativeDistPath,
}: { runtime: string; appDirectory: string; relativeDistPath: string }) {
  const pluginDir = path.resolve(
    appDirectory,
    `./${relativeDistPath}`,
    'runtime',
  );

  const source = `import { configure as _configure } from '${runtime}'
    const configure = (options) => {
      return _configure({
        ...options,
        requestId: '${process.env.npm_package_name}',
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
    requestId?: string;
  };
  export declare const configure: (options: IOptions) => void;`;
  const pluginTypePath = path.join(pluginDir, 'index.d.ts');
  await fs.ensureFile(pluginTypePath);
  await fs.writeFile(pluginTypePath, tsSource);
}

export default runtimeGenerator;
