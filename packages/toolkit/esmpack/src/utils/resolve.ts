import {
  CachedInputFileSystem,
  ResolverFactory,
  Resolver,
} from 'enhanced-resolve';
import { fs } from '@modern-js/utils';

const resolver: Resolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  conditionNames: ['import', 'module', 'development', 'browser'],
  aliasFields: ['browser'],
  mainFields: ['browser', 'module', 'main'],
  modules: ['node_modules'],
  mainFiles: ['index'],
  extensions: ['.js', '.json'],
  exportsFields: ['exports'],
});

async function resolve(specifier: string, importer: string) {
  const resolveResult = await new Promise<string>((resolve, reject) => {
    resolver.resolve({}, importer, specifier, {}, (err, filePath) => {
      if (err) {
        return reject(err);
      }
      if (!filePath) {
        return reject(
          new Error(
            `Empty result when resolving ${specifier} from ${importer}`,
          ),
        );
      }
      return resolve(filePath);
    });
  });
  return resolveResult;
}

export { resolve };
