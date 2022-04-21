import { fs, onExitProcess } from '@modern-js/utils';
import { bundle, Options } from './bundle';

export { bundle };

export async function bundleRequire(filepath: string, options?: Options) {
  const configFile = await bundle(filepath, options);

  let mod;
  const req = options?.require || require;
  try {
    mod = await req(configFile);
  } finally {
    onExitProcess(() => {
      // Remove the configFile before exit process
      fs.unlinkSync(configFile);
    });
  }

  return mod;
}
