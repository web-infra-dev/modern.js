import { fs } from '@modern-js/utils';
import { bundle, Options } from './bundle';

export { bundle };

function deleteRequireCache(path: string) {
  if (require.cache[path]) {
    delete require.cache[path];
  }
  if (module.children) {
    module.children = module.children.filter(item => item.filename !== path);
  }
}

export async function bundleRequire(filepath: string, options?: Options) {
  const configFile = await bundle(filepath, options);

  let mod;
  const req = options?.require || require;
  try {
    mod = await req(configFile);

    // Webpack will check require history for persistent cache.
    // If webpack can not resolve the file, the previous cache pack will become invalid.
    // The bundled file is temporary, so we should clear the require history to avoid breaking the webpack cache.
    deleteRequireCache(configFile);
  } finally {
    fs.unlinkSync(configFile);
  }

  return mod;
}
