import { Schema } from '@modern-js/codesmith-formily';
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

export const getModuleNewActionSchema = (
  _extra: Record<string, any>,
): Schema => {
  return {
    type: 'object',
    properties: {
      actionType: {
        type: 'string',
        title: i18n.t(localeKeys.action.self),
        enum: ModuleActionTypes.map(type => ({
          value: type,
          label: ActionTypeText[type](),
          type: ['string'],
        })),
      },
      [ActionType.Function]: {
        type: 'string',
        title: ActionTypeText[ActionType.Function](),
        enum: ModuleActionFunctions.map(func => ({
          value: func,
          label: ActionFunctionText[func](),
        })),
        'x-reactions': [
          {
            dependencies: ['actionType'],
            fulfill: {
              state: {
                visible: '{{$deps[0].value === "function"}}',
              },
            },
          },
        ],
      },
    },
  };
};

export const ModuleActionFunctionsDevDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.Less]: '@modern-js/plugin-less',
  [ActionFunction.Sass]: '@modern-js/plugin-sass',
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
