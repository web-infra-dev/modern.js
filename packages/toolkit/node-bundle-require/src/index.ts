import { fs } from '@modern-js/utils';
import { bundle, Options } from './bundle';

export { bundle };

export async function bundleRequire(filepath: string, options?: Options) {
  const configFile = await bundle(filepath, options);

  let mod;
  const req = options?.require || require;
  try {
    mod = await req(configFile);
  } finally {
    // Remove the configFile after executed
    fs.unlinkSync(configFile);
  }

  return mod;
}
