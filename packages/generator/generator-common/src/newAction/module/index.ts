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
  ActionFunction.Test,
  ActionFunction.TailwindCSS,
  ActionFunction.Storybook,
  ActionFunction.RuntimeApi,
];

export const ModuleActionTypesMap: Record<string, string[]> = {
  [ActionType.Function]: ModuleActionFunctions,
};

export const ModuleSpecialSchemaMap: Record<string, Schema> = {};

export const getModuleNewActionSchema = (
  extra: Record<string, any> = {},
): Schema => {
  const { funcMap = {} } = extra;
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
        enum: ModuleActionFunctions.filter(func => !funcMap[func]).map(
          func => ({
            value: func,
            label: ActionFunctionText[func](),
          }),
        ),
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
  [ActionFunction.Storybook]: '@modern-js/plugin-storybook',
  [ActionFunction.Test]: '@modern-js/plugin-testing',
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
  [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
};

export const ModuleNewActionGenerators: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Function]: {
    [ActionFunction.Test]: '@modern-js/test-generator',
    [ActionFunction.TailwindCSS]: '@modern-js/tailwindcss-generator',
    [ActionFunction.Storybook]: '@modern-js/storybook-generator',
    [ActionFunction.RuntimeApi]: '@modern-js/dependence-generator',
  },
};

export const ModuleNewActionPluginName: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: 'TailwindCSSPlugin',
    [ActionFunction.Storybook]: 'StoryBookPlugin',
    [ActionFunction.Test]: 'TestPlugin',
  },
};

export const ModuleNewActionPluginDependence: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
    [ActionFunction.Storybook]: '@modern-js/plugin-storybook',
  },
};
