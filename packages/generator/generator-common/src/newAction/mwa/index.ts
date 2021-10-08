import { Schema } from '@modern-js/easy-form-core';
import {
  ActionElement,
  ActionFunction,
  ActionRefactor,
  ActionType,
  ActionTypeText,
  ActionTypeTextMap,
} from '../common';
import { i18n, localeKeys } from '@/locale';

export const MWAActionTypes = [
  ActionType.Element,
  ActionType.Function,
  // ActionType.Refactor,
];

export const MWAActionFunctions = [
  ActionFunction.UnBundle,
  // ActionFunction.TailwindCSS,
  ActionFunction.Less,
  ActionFunction.Sass,
  ActionFunction.BFF,
  ActionFunction.MicroFrontend,
  ActionFunction.Electron,
  // ActionFunction.I18n,
  ActionFunction.Test,
  // ActionFunction.E2ETest,
  // ActionFunction.Doc,
];
export const MWAActionElements = [
  ActionElement.Entry,
  ActionElement.Server,
  // ActionElement.Env,
];
export const MWAActionReactors = [ActionRefactor.BFFToApp];

export const MWAActionTypesMap: Record<ActionType, string[]> = {
  [ActionType.Element]: MWAActionElements,
  [ActionType.Function]: MWAActionFunctions,
  [ActionType.Refactor]: MWAActionReactors,
};

export const MWASpecialSchemaMap: Record<string, Schema> = {};

export const MWANewActionSchema: Schema = {
  key: 'mwa_new_action',
  isObject: true,
  items: [
    {
      key: 'actionType',
      label: () => i18n.t(localeKeys.action.self),
      type: ['string'],
      mutualExclusion: true,
      items: MWAActionTypes.map(type => ({
        key: type,
        label: ActionTypeText[type],
        type: ['string'],
        mutualExclusion: true,
        items: MWAActionTypesMap[type].map(
          item =>
            MWASpecialSchemaMap[item] || {
              key: item,
              label: ActionTypeTextMap[type][item],
            },
        ),
      })),
    },
  ],
};

export const MWAActionFunctionsDevDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.UnBundle]: '@modern-js/plugin-unbundle',
  [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
  [ActionFunction.Test]: '@modern-js/plugin-testing',
  [ActionFunction.E2ETest]: '@modern-js/plugin-e2e',
  [ActionFunction.Doc]: '@modern-js/plugin-docsite',
  [ActionFunction.Electron]: '@modern-js/plugin-electron',
};

export const MWAActionFunctionsDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.Less]: '@modern-js/plugin-less',
  [ActionFunction.Sass]: '@modern-js/plugin-sass',
  [ActionFunction.BFF]: '@modern-js/plugin-bff',
  [ActionFunction.MicroFrontend]: '@modern-js/plugin-micro-frontend',

  [ActionFunction.I18n]: '@modern-js/plugin-i18n',
};

export const MWANewActionGenerators: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Entry]:
      '/Users/admin/github/modern.js/packages/generator/generators/entry-generator',
    [ActionElement.Env]:
      '/Users/admin/github/modern.js/packages/generator/generators/env-generator',
    [ActionElement.Server]:
      '/Users/admin/github/modern.js/packages/generator/generators/server-generator',
  },
  [ActionType.Function]: {
    [ActionFunction.UnBundle]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
    [ActionFunction.TailwindCSS]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
    [ActionFunction.Less]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
    [ActionFunction.Sass]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
    [ActionFunction.BFF]:
      '/Users/admin/github/modern.js/packages/generator/generators/bff-generator',
    [ActionFunction.MicroFrontend]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
    [ActionFunction.Electron]:
      '/Users/admin/github/modern.js/packages/generator/generators/electron-generator',
    [ActionFunction.I18n]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
    [ActionFunction.Test]:
      '/Users/admin/github/modern.js/packages/generator/generators/test-generator',
    [ActionFunction.E2ETest]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
    [ActionFunction.Doc]:
      '/Users/admin/github/modern.js/packages/generator/generators/dependence-generator',
  },
  [ActionType.Refactor]: {
    [ActionRefactor.BFFToApp]:
      '/Users/admin/github/modern.js/packages/generator/generators/bff-refactor-generator',
  },
};
