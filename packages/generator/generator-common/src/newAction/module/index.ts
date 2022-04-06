import { Schema } from '@modern-js/easy-form-core';
import {
  ActionFunction,
  ActionFunctionText,
  ActionType,
  ActionTypeText,
} from '../common';
import { i18n, localeKeys } from '../../locale';

export const ModuleActionTypes = [ActionType.Function];
export const ModuleActionFunctions = [
  ActionFunction.TailwindCSS,
  ActionFunction.Less,
  ActionFunction.Sass,
  // ActionFunction.I18n,
  // ActionFunction.Doc,
  ActionFunction.Storybook,
  ActionFunction.RuntimeApi,
];

export const ModuleActionTypesMap: Record<string, string[]> = {
  [ActionType.Function]: ModuleActionFunctions,
};

export const ModuleSpecialSchemaMap: Record<string, Schema> = {};

export const ModuleNewActionSchema: Schema = {
  key: 'Module_new_action',
  isObject: true,
  items: [
    {
      key: 'actionType',
      label: () => i18n.t(localeKeys.action.self),
      type: ['string'],
      mutualExclusion: true,
      items: ModuleActionTypes.map(type => ({
        key: type,
        label: ActionTypeText[type],
        type: ['string'],
        mutualExclusion: true,
        items: ModuleActionFunctions.map(
          func =>
            ModuleSpecialSchemaMap[func] || {
              key: func,
              label: ActionFunctionText[func],
            },
        ),
      })),
    },
  ],
};

export const ModuleActionFunctionsDevDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.Doc]: '@modern-js/plugin-docsite',
  [ActionFunction.Storybook]: '@modern-js/plugin-storybook',
  [ActionFunction.RuntimeApi]: '@modern-js/runtime',
  [ActionFunction.TailwindCSS]: 'tailwindcss',
};

export const ModuleActionFunctionsPeerDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.RuntimeApi]: '@modern-js/runtime',
  [ActionFunction.TailwindCSS]: 'tailwindcss',
};

export const ModuleActionFunctionsDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.I18n]: '@modern-js/plugin-i18n',
  [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
  [ActionFunction.Less]: '@modern-js/plugin-less',
  [ActionFunction.Sass]: '@modern-js/plugin-sass',
};

export const ModuleNewActionGenerators: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: '@modern-js/tailwindcss-generator',
    [ActionFunction.Less]: '@modern-js/dependence-generator',
    [ActionFunction.Sass]: '@modern-js/dependence-generator',
    [ActionFunction.I18n]: '@modern-js/dependence-generator',
    [ActionFunction.Test]: '@modern-js/dependence-generator',
    [ActionFunction.Doc]: '@modern-js/dependence-generator',
    [ActionFunction.Storybook]: '@modern-js/storybook-generator',
    [ActionFunction.RuntimeApi]: '@modern-js/dependence-generator',
  },
};
