import path from 'path';
import { downloadPackage, getPackageInfo } from '@modern-js/codesmith';
import { requireModuleWithVm } from './vm';

export async function installPlugins(plugins: string[], registryUrl?: string) {
  return Promise.all(
    plugins.map(async plugin => {
      if (path.isAbsolute(plugin)) {
        return {
          templatePath: plugin,
          module: requireModuleWithVm(plugin),
        };
      } else {
        const { name, version } = getPackageInfo(plugin);
        const pluginPath = await downloadPackage(name, version, {
          registryUrl,
        });
        return {
          templatePath: pluginPath,
          module: requireModuleWithVm(pluginPath),
        };
      }
    }),
  );
}
