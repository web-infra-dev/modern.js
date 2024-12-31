import path from 'path';
import { fs } from '@modern-js/utils';

async function runtimeGenerator(runtime: string) {
  const cwd = process.cwd();
  const pluginPath = path.resolve(cwd, './dist', 'runtime');
  if (!fs.existsSync(pluginPath)) {
    fs.mkdirSync(pluginPath);
  }
  const source = `import { configure as _configure } from '${runtime}'
    const configure = (options) => {
      return _configure({
        ...options,
        requestId: '${process.env.npm_package_name}',
      });
    }
    export { configure }
  `;

  const tsSource = `type IOptions<F = typeof fetch> = {
    request?: F;
    interceptor?: (request: F) => F;
    allowedHeaders?: string[];
    requestId?: string;
  };
  export declare const configure: (options: IOptions) => void;`;

  fs.writeFileSync(path.join(pluginPath, 'index.js'), source);

  fs.writeFileSync(path.join(pluginPath, 'index.d.ts'), tsSource);
}

export default runtimeGenerator;
