import { Schema } from '@modern-js/codesmith-formily';
import {
  ActionFunction,
  ActionFunctionText,
  ActionType,
  ActionTypeQuestionText,
  ActionTypeText,
} from '../common';
import { i18n, localeKeys } from '../../locale';

export const ModuleActionTypes = [ActionType.Function];
export const ModuleActionFunctions = [
  ActionFunction.TailwindCSS,
  ActionFunction.StorybookV7,
  ActionFunction.RuntimeApi,
  ActionFunction.ModuleDoc,
];

export const ModuleActionTypesMap: Record<string, string[]> = {
  [ActionType.Function]: ModuleActionFunctions,
};

export const ModuleSpecialSchemaMap: Record<string, Schema> = {};

export const getModuleNewActionSchema = (): Schema => {
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
        title: ActionTypeQuestionText[ActionType.Function](),
        enum: ModuleActionFunctions.map(func => ({
          value: func,
          label: ActionFunctionText[func](),
        })),
        'x-reactions': [
          {
            dependencies: ['actionType'],
            fulfill: {
              state: {
                visible: '{{$deps[0] === "function"}}',
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
  [ActionFunction.StorybookV7]: '@modern-js/storybook',
  [ActionFunction.RuntimeApi]: '@modern-js/runtime',
  [ActionFunction.TailwindCSS]: 'tailwindcss',
  [ActionFunction.ModuleDoc]: '@modern-js/plugin-rspress',
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
  [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
};

export const ModuleNewActionGenerators: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: '@modern-js/tailwindcss-generator',
    [ActionFunction.StorybookV7]: '@modern-js/storybook-next-generator',
    [ActionFunction.RuntimeApi]: '@modern-js/dependence-generator',
    [ActionFunction.ModuleDoc]: '@modern-js/module-doc-generator',
  },
};

export const ModuleNewActionPluginName: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: 'tailwindcssPlugin',
    [ActionFunction.ModuleDoc]: 'modulePluginDoc',
  },
};

export const ModuleNewActionPluginDependence: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
    [ActionFunction.ModuleDoc]: '@modern-js/plugin-rspress',
  },
};
