import { Schema } from '@modern-js/codesmith-formily';
import {
  ActionElement,
  ActionElementText,
  ActionFunction,
  ActionFunctionText,
  ActionRefactor,
  ActionType,
  ActionTypeText,
} from '../common';
import { i18n, localeKeys } from '../../locale';

export const MWAActionTypes = [
  ActionType.Element,
  ActionType.Function,
  // ActionType.Refactor,
];

export const MWAActionFunctions = [
  ActionFunction.TailwindCSS,
  ActionFunction.Less,
  ActionFunction.Sass,
  ActionFunction.BFF,
  ActionFunction.SSG,
  ActionFunction.MicroFrontend,
  // ActionFunction.I18n,
  ActionFunction.Test,
  ActionFunction.Storybook,
  // ActionFunction.E2ETest,
  // ActionFunction.Doc,
  ActionFunction.Polyfill,
  ActionFunction.Proxy,
];
export const MWAActionElements = [ActionElement.Entry, ActionElement.Server];
export const MWAActionReactors = [ActionRefactor.BFFToApp];

export const MWAActionTypesMap: Record<ActionType, string[]> = {
  [ActionType.Element]: MWAActionElements,
  [ActionType.Function]: MWAActionFunctions,
  [ActionType.Refactor]: MWAActionReactors,
};

export const getMWANewActionSchema = (
  extra: Record<string, any> = {},
): Schema => {
  const { funcMap = {} } = extra;
  const funcs = MWAActionFunctions.filter(func => !funcMap[func]);
  return {
    type: 'object',
    properties: {
      actionType: {
        type: 'string',
        title: i18n.t(localeKeys.action.self),
        enum: MWAActionTypes.filter(type =>
          type === ActionType.Function ? funcs.length > 0 : true,
        ).map(type => ({
          value: type,
          label: ActionTypeText[type](),
          type: ['string'],
        })),
      },
      [ActionType.Element]: {
        type: 'string',
        title: ActionTypeText[ActionType.Element](),
        enum: MWAActionElements.map(element => ({
          value: element,
          label: ActionElementText[element](),
        })),
        'x-reactions': [
          {
            dependencies: ['actionType'],
            fulfill: {
              state: {
                visible: '{{$deps[0] === "element"}}',
              },
            },
          },
        ],
      },
      [ActionType.Function]: {
        type: 'string',
        title: ActionTypeText[ActionType.Function](),
        enum: funcs.map(func => ({
          value: func,
          label:
            func === ActionFunction.Storybook
              ? i18n.t(localeKeys.action.function.mwa_storybook)
              : ActionFunctionText[func](),
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

export const MWAActionFunctionsDevDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.Less]: '@modern-js/plugin-less',
  [ActionFunction.Sass]: '@modern-js/plugin-sass',
  [ActionFunction.SSG]: '@modern-js/plugin-ssg',
  [ActionFunction.Test]: '@modern-js/plugin-testing',
  [ActionFunction.E2ETest]: '@modern-js/plugin-e2e',
  [ActionFunction.Storybook]: '@modern-js/plugin-storybook',
  [ActionFunction.Proxy]: '@modern-js/plugin-proxy',
  [ActionFunction.TailwindCSS]: 'tailwindcss',
};

export const MWAActionFunctionsDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.BFF]: '@modern-js/plugin-bff',
  [ActionFunction.MicroFrontend]: '@modern-js/plugin-garfish',
  [ActionFunction.I18n]: '@modern-js/plugin-i18n',
  [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
  [ActionFunction.Polyfill]: '@modern-js/plugin-polyfill',
};

export const MWAActionFunctionsAppendTypeContent: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.MicroFrontend]: `/// <reference types='@modern-js/plugin-garfish/types' />`,
};

export const MWANewActionGenerators: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Entry]: '@modern-js/entry-generator',
    [ActionElement.Server]: '@modern-js/server-generator',
  },
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: '@modern-js/tailwindcss-generator',
    [ActionFunction.Less]: '@modern-js/dependence-generator',
    [ActionFunction.Sass]: '@modern-js/dependence-generator',
    [ActionFunction.BFF]: '@modern-js/bff-generator',
    [ActionFunction.MicroFrontend]: '@modern-js/dependence-generator',
    [ActionFunction.I18n]: '@modern-js/dependence-generator',
    [ActionFunction.Test]: '@modern-js/test-generator',
    [ActionFunction.E2ETest]: '@modern-js/dependence-generator',
    [ActionFunction.Doc]: '@modern-js/dependence-generator',
    [ActionFunction.Storybook]: '@modern-js/dependence-generator',
    [ActionFunction.SSG]: '@modern-js/ssg-generator',
    [ActionFunction.Polyfill]: '@modern-js/dependence-generator',
    [ActionFunction.Proxy]: '@modern-js/dependence-generator',
  },
  [ActionType.Refactor]: {
    [ActionRefactor.BFFToApp]: '@modern-js/bff-refactor-generator',
  },
};
