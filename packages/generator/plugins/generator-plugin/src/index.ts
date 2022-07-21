import {
  IPluginContext,
  ForgedAPI,
  FileType,
  PluginType,
  InputType,
} from '@modern-js/generator-plugin';
import { Solution, SolutionText } from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';

export default function (context: IPluginContext) {
  context.setInput('packageName', 'name', i18n.t(localeKeys.package_name));
  context.setInputValue({
    needModifyModuleConfig: 'no',
    moduleRunWay: 'no',
  });
  context.addInputAfter('packageManager', {
    key: 'pluginType',
    name: i18n.t(localeKeys.plugin_type.self),
    type: InputType.Radio,
    options: Object.values(PluginType).map(type => ({
      key: type,
      name: i18n.t(localeKeys.plugin_type[type]),
    })),
  });
  context.addInputAfter('packageManager', {
    key: 'key',
    name: i18n.t(localeKeys.key),
    type: InputType.Input,
    when: (data: Record<string, unknown>) =>
      data.pluginType === PluginType.Custom,
  });
  context.addInputAfter('packageManager', {
    key: 'name',
    name: i18n.t(localeKeys.name),
    type: InputType.Input,
    when: (data: Record<string, unknown>) =>
      data.pluginType === PluginType.Custom,
  });
  context.addInputAfter('packageManager', {
    key: 'extend',
    name: i18n.t(localeKeys.base),
    type: InputType.Radio,
    when: (data: Record<string, unknown>) =>
      data.pluginType === PluginType.Extend,
    options: Object.values(Solution).map(solution => ({
      key: solution,
      name: SolutionText[solution],
    })),
  });
  context.addInputAfter('packageManager', {
    key: 'type',
    name: i18n.t(localeKeys.base),
    type: InputType.Radio,
    when: (data: Record<string, unknown>) =>
      data.pluginType === PluginType.Custom,
    options: [
      ...Object.values(Solution).map(solution => ({
        key: solution,
        name: SolutionText[solution],
      })),
      {
        key: 'custom',
        name: i18n.t(localeKeys.solution.custom),
      },
    ],
  });

  context.onForged(async (api: ForgedAPI, input: Record<string, unknown>) => {
    const { packageManager, language, pluginType, key, name, extend, type } =
      input;
    api.addFile({
      type: FileType.Text,
      file: `src/index.${language as string}`,
      templateFile: `index.${language as string}.handlebars`,
      force: true,
    });
    api.addFile({
      type: FileType.Text,
      file: `templates/.gitkeep`,
      templateFile: `.gitkeep`,
    });
    const meta =
      pluginType === PluginType.Extend ? { extend } : { key, name, type };
    await api.updateJSONFile('package.json', {
      files: ['/templates', '/dist/index.js'],
      main: './dist/index.js',
      types: undefined,
      module: undefined,
      meta,
      'jsnext:modern': undefined,
      exports: undefined,
      'scripts.prepare': `${packageManager as string} build`,
      'devDependencies.@modern-js/generator-plugin': '^1.0.0',
      'dependencies.vm2': '^3.9.2',
      'modernConfig.output.packageMode': 'node-js',
    });
    api.updateModernConfig({
      output: {
        buildConfig: {
          buildType: 'bundle',
          sourceMap: false,
          bundleOptions: {
            skipDeps: false,
            externals: ['vm2'],
          },
        },
      },
    });
    api.rmDir('tests');
    api.rmFile('.npmignore');
  });
}
