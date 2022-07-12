import path from 'path';
import findUp from 'find-up';
import { fs } from '@modern-js/utils';
import type { Compiler } from '../Compiler';
import type { EsmpackPlugin } from '../Options';
import { getWebDependencyName, normalizePackageName } from '../utils/package';
import { resolve } from '../utils/resolve';

class EntryPlugin implements EsmpackPlugin {
  constructor(public context: string) {}

  apply(compiler: Compiler) {
    // only when no other plugin tap make
    if (compiler.hooks.make.isUsed()) {
      return;
    }
    compiler.hooks.make.tapPromise('EntryPlugin', async compilation => {
      const specifier = compilation.specifier;
      const importer = compilation.importer || this.context;
      const resolveFromContext = async (
        specifier: string,
        importer: string,
      ) => {
        let ret: string = '';
        try {
          const resolvedResult = await resolve(specifier, importer);
          if (!resolvedResult) {
            throw new Error();
          }
          // See https://github.com/webpack/enhanced-resolve/blob/50ac336ea2b6b63157226eb03addeed21d6d8f58/lib/Resolver.js#L282
          ret = resolvedResult.replace(/\0#/g, '#');
        } catch (e) {
          const msg = `[EntryPlugin] Could not resolve ${specifier} in ${importer}`;
          compilation.logger.error(msg);
          throw new Error(msg);
        }
        return ret;
      };

      const specifierLoc: string = await resolveFromContext(
        specifier,
        importer,
      );

      const manifest = await this.getManifest(specifierLoc);

      const targetName = getWebDependencyName(specifier);

      compilation.specifierFilePath = specifierLoc;
      await compilation.addInput(
        {
          [targetName]: specifierLoc,
        },
        manifest,
      );
    });
  }

  private async getManifest(specifierLoc: string): Promise<any> {
    const packageJsonPath = await findUp('package.json', {
      cwd: specifierLoc,
    });
    if (!packageJsonPath) {
      throw new Error(`Could not find package.json from ${specifierLoc}`);
    }

    const manifest = JSON.parse(fs.readFileSync(packageJsonPath).toString());
    if (!manifest.name || !manifest.version) {
      const otherManifest = await this.getManifest(
        path.dirname(path.dirname(packageJsonPath)),
      );
      return otherManifest;
    }
    return manifest;
  }
}

export { EntryPlugin };
