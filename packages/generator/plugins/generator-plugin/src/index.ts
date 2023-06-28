import {
  IPluginContext,
  ForgedAPI,
  FileType,
  PluginType,
} from '@modern-js/generator-plugin';
import {
  Solution,
  SolutionText,
  i18n as commonI18n,
} from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';

export default function (context: IPluginContext) {
  commonI18n.changeLanguage({ locale: context.locale });
  i18n.changeLanguage({ locale: context.locale });
  context.setInput('packageName', 'title', i18n.t(localeKeys.package_name));
  context.addInputAfter('packageManager', {
    type: 'object',
    properties: {
      pluginType: {
        type: 'string',
        title: i18n.t(localeKeys.plugin_type.self),
        enum: Object.values(PluginType).map(type => ({
          value: type,
          title: i18n.t(localeKeys.plugin_type[type]),
        })),
      },
      key: {
        type: 'string',
        title: i18n.t(localeKeys.key),
        'x-reactions': [
          {
            dependencies: ['pluginType'],
            fulfill: {
              state: {
                visible: `{{$deps[0] === "${PluginType.Custom}"}}`,
              },
            },
          },
        ],
      },
      name: {
        type: 'string',
        title: i18n.t(localeKeys.name),
        'x-reactions': [
          {
            dependencies: ['pluginType'],
            fulfill: {
              state: {
                visible: `{{$deps[0] === "${PluginType.Custom}"}}`,
              },
            },
          },
        ],
      },
      extend: {
        type: 'string',
        title: i18n.t(localeKeys.base),
        enum: Object.values(Solution).map(solution => ({
          value: solution,
          label: SolutionText[solution](),
        })),
        'x-reactions': [
          {
            dependencies: ['pluginType'],
            fulfill: {
              state: {
                visible: `{{$deps[0] === "${PluginType.Extend}"}}`,
              },
            },
          },
        ],
      },
      type: {
        type: 'string',
        title: i18n.t(localeKeys.base),
        enum: [
          ...Object.values(Solution).map(solution => ({
            value: solution,
            label: SolutionText[solution](),
          })),
          {
            value: 'custom',
            label: i18n.t(localeKeys.solution.custom),
          },
        ],
        'x-reactions': [
          {
            dependencies: ['pluginType'],
            fulfill: {
              state: {
                visible: `{{$deps[0] === "${PluginType.Custom}"}}`,
              },
            },
          },
        ],
      },
    },
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
    api.addFile({
      type: FileType.Text,
      file: `modern.config.${language as string}`,
      templateFile: `modern.config.${language as string}.handlebars`,
      force: true,
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
      'devDependencies.@modern-js/generator-plugin': '^2.0.0',
    });
    api.rmFile('.npmignore');
  });
}
