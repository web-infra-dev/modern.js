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
  ActionFunction.TailwindCSS,
  ActionFunction.Less,
  ActionFunction.Sass,
  ActionFunction.BFF,
  ActionFunction.SSG,
  ActionFunction.MicroFrontend,
  ActionFunction.Electron,
  // ActionFunction.I18n,
  ActionFunction.Test,
  ActionFunction.Storybook,
  // ActionFunction.E2ETest,
  // ActionFunction.Doc,
  ActionFunction.Deploy,
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

export const MWASpecialSchemaMap: Record<string, Schema> = {
  [ActionFunction.Storybook]: {
    key: ActionFunction.Storybook,
    label: () => i18n.t(localeKeys.action.function.mwa_storybook),
  },
};

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
  [ActionFunction.Storybook]: '@modern-js/plugin-storybook',
};

export const MWAActionFunctionsDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.Less]: '@modern-js/plugin-less',
  [ActionFunction.Sass]: '@modern-js/plugin-sass',
  [ActionFunction.BFF]: '@modern-js/plugin-bff',
  [ActionFunction.MicroFrontend]: '@modern-js/plugin-micro-frontend',
  [ActionFunction.I18n]: '@modern-js/plugin-i18n',
  [ActionFunction.SSG]: '@modern-js/plugin-ssg',
};

export const MWANewActionGenerators: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Entry]: '@modern-js/entry-generator',
    [ActionElement.Env]: '@modern-js/env-generator',
    [ActionElement.Server]: '@modern-js/server-generator',
  },
  [ActionType.Function]: {
    [ActionFunction.UnBundle]: '@modern-js/unbundle-generator',
    [ActionFunction.TailwindCSS]: '@modern-js/tailwindcss-generator',
    [ActionFunction.Less]: '@modern-js/dependence-generator',
    [ActionFunction.Sass]: '@modern-js/dependence-generator',
    [ActionFunction.BFF]: '@modern-js/bff-generator',
    [ActionFunction.MicroFrontend]: '@modern-js/dependence-generator',
    [ActionFunction.Electron]: '@modern-js/electron-generator',
    [ActionFunction.I18n]: '@modern-js/dependence-generator',
    [ActionFunction.Test]: '@modern-js/test-generator',
    [ActionFunction.E2ETest]: '@modern-js/dependence-generator',
    [ActionFunction.Doc]: '@modern-js/dependence-generator',
    [ActionFunction.Storybook]: '@modern-js/dependence-generator',
    [ActionFunction.SSG]: '@modern-js/ssg-generator',
    [ActionFunction.Deploy]: '@modern-js/cloud-deploy-generator',
  },
  [ActionType.Refactor]: {
    [ActionRefactor.BFFToApp]: '@modern-js/bff-refactor-generator',
  },
};
