import type { CLIPluginAPI } from '@modern-js/plugin';
import type { Entrypoint } from '@modern-js/types';
import { getEntryOptions, isApiOnly } from '@modern-js/utils';
import type { AppNormalizedConfig, AppTools } from '../types';
import { isMainEntry } from '../utils/routes';
import type { InfoOptions } from '../utils/types';

export interface EntryInfo {
  entryName: string;
  isMainEntry: boolean;
  entry: string;
  isAutoMount: boolean;
  isCustomSourceEntry: boolean;
  customEntry: boolean;
  ssr: boolean | 'stream' | 'string';
  ssg: boolean;
}

export interface CliPluginInfo {
  name: string;
}

export interface RuntimePluginInfo {
  name: string;
  path: string;
  config: Record<string, any>;
}

export interface ServerPluginInfo {
  name: string;
  options?: Record<string, any>;
}

export interface PluginsInfo {
  cli: CliPluginInfo[];
  runtime: Record<string, RuntimePluginInfo[]>;
  server: ServerPluginInfo[];
}

export interface ProjectInfo {
  entries: EntryInfo[];
  plugins: PluginsInfo;
  apiOnly: boolean;
}

export const info = async (
  api: CLIPluginAPI<AppTools>,
  options: InfoOptions = {},
): Promise<void> => {
  const normalizedConfig = api.getNormalizedConfig() as AppNormalizedConfig;
  const appContext = api.getAppContext();
  const hooks = api.getHooks();

  // Collect CLI plugins (already in execution order from plugin manager)
  const cliPlugins: CliPluginInfo[] = appContext.plugins.map(p => ({
    name: p.name,
  }));

  // Collect server plugins via hook
  const { plugins: rawServerPlugins } = await hooks._internalServerPlugins.call(
    { plugins: [] },
  );
  const serverPlugins: ServerPluginInfo[] = rawServerPlugins.map(p => ({
    name: p.name,
    ...(p.options && Object.keys(p.options).length > 0
      ? { options: p.options }
      : {}),
  }));

  const apiOnly = await isApiOnly(
    appContext.appDirectory,
    normalizedConfig.source?.entriesDir,
    appContext.apiDirectory,
  );

  if (apiOnly) {
    const projectInfo: ProjectInfo = {
      entries: [],
      plugins: { cli: cliPlugins, runtime: {}, server: serverPlugins },
      apiOnly: true,
    };
    printProjectInfo(projectInfo, options.json);
    return;
  }

  const [{ getBundleEntry }] = await Promise.all([
    import('../plugins/analyze/getBundleEntry.js'),
  ]);

  // get runtime entry points
  const { entrypoints } = await hooks.modifyEntrypoints.call({
    entrypoints: await getBundleEntry(
      hooks,
      appContext as any,
      normalizedConfig,
    ),
  });

  // Collect runtime plugins per entrypoint
  const runtimePluginsByEntry: Record<string, RuntimePluginInfo[]> = {};
  for (const entrypoint of entrypoints) {
    const { plugins: runtimePlugins } =
      await hooks._internalRuntimePlugins.call({
        entrypoint,
        plugins: [],
      });
    runtimePluginsByEntry[entrypoint.entryName] = runtimePlugins.map(p => ({
      name: p.name,
      path: p.path,
      config: p.config,
    }));
  }

  const {
    source: { mainEntryName },
    server: { ssr, ssrByEntries },
    output: { ssg, ssgByEntries },
  } = normalizedConfig;
  const { packageName } = appContext;

  const entries: EntryInfo[] = entrypoints.map((entrypoint: Entrypoint) => {
    const { entryName, entry, isAutoMount, isCustomSourceEntry, customEntry } =
      entrypoint;
    const isMain = isMainEntry(entryName, mainEntryName);

    // Get SSR options for this entry
    const ssrOptions = getEntryOptions(
      entryName,
      isMain,
      ssr,
      ssrByEntries,
      packageName,
    );

    // Get SSG options for this entry
    const ssgOptions = getEntryOptions(
      entryName,
      isMain,
      ssg,
      ssgByEntries,
      packageName,
    );

    // Determine SSR mode
    let ssrMode: boolean | 'stream' | 'string' = false;
    if (ssrOptions) {
      if (typeof ssrOptions === 'boolean') {
        // When ssr is boolean true, default mode is 'stream'
        ssrMode = 'stream';
      } else if (typeof ssrOptions === 'object') {
        // When ssr is object, default mode is 'stream' unless explicitly set to 'string'
        ssrMode = ssrOptions.mode === 'string' ? 'string' : 'stream';
      }
    }

    return {
      entryName,
      isMainEntry: isMain,
      entry,
      isAutoMount: isAutoMount ?? true,
      isCustomSourceEntry: isCustomSourceEntry ?? false,
      customEntry: customEntry ?? false,
      ssr: ssrMode,
      ssg: Boolean(ssgOptions),
    };
  });

  const projectInfo: ProjectInfo = {
    entries,
    plugins: {
      cli: cliPlugins,
      runtime: runtimePluginsByEntry,
      server: serverPlugins,
    },
    apiOnly: false,
  };

  printProjectInfo(projectInfo, options.json);
};

function printProjectInfo(projectInfo: ProjectInfo, jsonOnly?: boolean): void {
  if (jsonOnly) {
    // Output pure JSON for machine reading
    console.log(JSON.stringify(projectInfo, null, 2));
    return;
  }

  // Output as JSON for easy parsing by agents
  console.log('');
  console.log('===== Modern.js Project Info =====');
  console.log('');
  console.log(JSON.stringify(projectInfo, null, 2));
  console.log('');
  console.log('===== Entry Details =====');
  console.log('');

  if (projectInfo.apiOnly) {
    console.log('This is an API-only project (no page entries).');
  } else if (projectInfo.entries.length === 0) {
    console.log('No entries found.');
  } else {
    for (const entry of projectInfo.entries) {
      console.log(`Entry: ${entry.entryName}`);
      console.log(`  - Path: ${entry.entry}`);
      console.log(`  - Main Entry: ${entry.isMainEntry}`);
      console.log(`  - Auto Mount: ${entry.isAutoMount}`);
      console.log(`  - Custom Entry: ${entry.customEntry}`);
      console.log(`  - Custom Source Entry: ${entry.isCustomSourceEntry}`);
      console.log(`  - Rendering Mode:`);
      if (entry.ssg) {
        console.log(`    - SSG: enabled`);
      } else if (entry.ssr) {
        console.log(`    - SSR: ${entry.ssr} mode`);
      } else {
        console.log(`    - CSR: enabled (default)`);
      }
      console.log('');
    }
  }

  printPluginsInfo(projectInfo.plugins);
}

function formatConfig(obj: Record<string, any>, indent: string): string {
  const json = JSON.stringify(obj, null, 2);
  return json
    .split('\n')
    .map((line, i) => (i === 0 ? line : `${indent}${line}`))
    .join('\n');
}

function printPluginsInfo(plugins: PluginsInfo): void {
  console.log('===== Plugins =====');
  console.log('');

  // CLI Plugins
  console.log('CLI Plugins (execution order):');
  if (plugins.cli.length === 0) {
    console.log('  (none)');
  } else {
    for (let i = 0; i < plugins.cli.length; i++) {
      console.log(`  #${i + 1} ${plugins.cli[i].name}`);
    }
  }
  console.log('');

  // Server Plugins
  console.log('Server Plugins (execution order):');
  if (plugins.server.length === 0) {
    console.log('  (none)');
  } else {
    for (let i = 0; i < plugins.server.length; i++) {
      const plugin = plugins.server[i];
      console.log(`  #${i + 1} ${plugin.name}`);
      if (plugin.options) {
        console.log(`      options: ${formatConfig(plugin.options, '      ')}`);
      }
    }
  }
  console.log('');

  // Runtime Plugins
  console.log('Runtime Plugins:');
  const entryNames = Object.keys(plugins.runtime);
  if (entryNames.length === 0) {
    console.log('  (none)');
  } else {
    for (const entryName of entryNames) {
      const entryPlugins = plugins.runtime[entryName];
      console.log(`  Entry: ${entryName}`);
      if (entryPlugins.length === 0) {
        console.log('    (none)');
      } else {
        for (let i = 0; i < entryPlugins.length; i++) {
          const plugin = entryPlugins[i];
          console.log(`    #${i + 1} ${plugin.name}`);
          console.log(
            `       config: ${formatConfig(plugin.config, '       ')}`,
          );
        }
      }
    }
  }
  console.log('');
}
