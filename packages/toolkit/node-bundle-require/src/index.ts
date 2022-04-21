import { fs, onExitProcess } from '@modern-js/utils';
import { bundle, Options } from './bundle';

export { bundle };

export async function bundleRequire(filepath: string, options?: Options) {
  const configFile = await bundle(filepath, options);

  let mod;
  const req = options?.require || require;
  try {
    mod = await req(configFile);

    // Webpack will check require history for persistent cache.
    // If webpack can not resolve the file, the previous cache pack will become invalid.
    // The bundled file is temporary, so we should clear the require history to avoid breaking the webpack cache.
    if (require.cache[configFile]) {
      delete require.cache[configFile];
    }
    if (module.children) {
      module.children = module.children.filter(
        item => item.filename !== configFile,
      );
    }
  } finally {
    onExitProcess(() => {
      // Remove the configFile before exit process
      fs.unlinkSync(configFile);
    });
  }

  return mod;
}
