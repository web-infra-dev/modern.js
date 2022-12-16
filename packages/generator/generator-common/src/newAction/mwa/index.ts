import { Schema } from '@modern-js/codesmith-formily';
import { Framework } from '../../mwa/common';
import {
  ActionElement,
  ActionElementText,
  ActionFunction,
  ActionFunctionText,
  ActionRefactor,
  ActionRefactorText,
  ActionType,
  ActionTypeText,
} from '../common';
import { i18n, localeKeys } from '../../locale';

export const MWAActionTypes = [
  ActionType.Element,
  ActionType.Function,
  ActionType.Refactor,
];

export const MWAActionFunctions = [
  ActionFunction.TailwindCSS,
  ActionFunction.BFF,
  ActionFunction.SSG,
  ActionFunction.MicroFrontend,
  ActionFunction.Test,
  ActionFunction.Storybook,
  ActionFunction.Polyfill,
  ActionFunction.Proxy,
  ActionFunction.SWC,
];

export const MWAActionElements = [ActionElement.Entry, ActionElement.Server];
export const MWAActionReactors = [ActionRefactor.ReactRouter5];

export const MWAActionTypesMap: Record<ActionType, string[]> = {
  [ActionType.Element]: MWAActionElements,
  [ActionType.Function]: MWAActionFunctions,
  [ActionType.Refactor]: MWAActionReactors,
};

export const getMWANewActionSchema = (
  extra: Record<string, any> = {},
): Schema => {
  const { funcMap = {}, refactorMap = {} } = extra;
  const funcs = MWAActionFunctions.filter(func => !funcMap[func]);
  const refactors = MWAActionReactors.filter(reactor => !refactorMap[reactor]);
  return {
    type: 'object',
    properties: {
      actionType: {
        type: 'string',
        title: i18n.t(localeKeys.action.self),
        enum: MWAActionTypes.filter(type =>
          type === ActionType.Function ? funcs.length > 0 : true,
        )
          .filter(type =>
            type === ActionType.Refactor ? refactors.length > 0 : true,
          )
          .map(type => ({
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
      [ActionType.Refactor]: {
        type: 'string',
        title: ActionTypeText[ActionType.Refactor](),
        enum: refactors.map(refactor => ({
          value: refactor,
          label: ActionRefactorText[refactor](),
        })),
        'x-reactions': [
          {
            dependencies: ['actionType'],
            fulfill: {
              state: {
                visible: '{{$deps[0] === "refactor"}}',
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
  [ActionFunction.SSG]: '@modern-js/plugin-ssg',
  [ActionFunction.Test]: '@modern-js/plugin-testing',
  [ActionFunction.Storybook]: '@modern-js/plugin-storybook',
  [ActionFunction.Proxy]: '@modern-js/plugin-proxy',
  [ActionFunction.TailwindCSS]: 'tailwindcss',
  [ActionFunction.SWC]: '@modern-js/plugin-swc',
};

export const MWAActionFunctionsDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.BFF]: '@modern-js/plugin-bff',
  [ActionFunction.MicroFrontend]: '@modern-js/plugin-garfish',
  [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
  [ActionFunction.Polyfill]: '@modern-js/plugin-polyfill',
};

export const MWAActionFunctionsAppendTypeContent: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.MicroFrontend]: `/// <reference types='@modern-js/plugin-garfish/types' />`,
  [ActionFunction.Test]: `/// <reference types='@modern-js/plugin-testing/types' />`,
};

export const MWAActionRefactorDependencies: Partial<
  Record<ActionRefactor, string>
> = {
  [ActionRefactor.ReactRouter5]: '@modern-js/plugin-router-v5',
};

export const MWAActionReactorAppendTypeContent: Partial<
  Record<ActionRefactor, string>
> = {
  [ActionRefactor.ReactRouter5]: `/// <reference types='@modern-js/plugin-router-v5/types' />`,
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
    [ActionFunction.BFF]: '@modern-js/bff-generator',
    [ActionFunction.MicroFrontend]: '@modern-js/dependence-generator',
    [ActionFunction.Test]: '@modern-js/test-generator',
    [ActionFunction.Storybook]: '@modern-js/dependence-generator',
    [ActionFunction.SSG]: '@modern-js/dependence-generator',
    [ActionFunction.Polyfill]: '@modern-js/dependence-generator',
    [ActionFunction.Proxy]: '@modern-js/dependence-generator',
    [ActionFunction.SWC]: '@modern-js/dependence-generator',
  },
  [ActionType.Refactor]: {
    [ActionRefactor.ReactRouter5]: '@modern-js/router-v5-generator',
  },
};

export const MWANewActionPluginName: Partial<
  Record<ActionType, Record<string, string>>
> = {
  [ActionType.Element]: {
    [ActionElement.Server]: 'ServerPlugin',
  },
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: 'TailwindCSSPlugin',
    [ActionFunction.BFF]: 'BFFPlugin',
    [ActionFunction.MicroFrontend]: 'MicroFrontendPlugin',
    [ActionFunction.Test]: 'TestPlugin',
    [ActionFunction.Storybook]: 'StorybookPlugin',
    [ActionFunction.SSG]: 'SSGPlugin',
    [ActionFunction.Polyfill]: 'PolyfillPlugin',
    [ActionFunction.Proxy]: 'ProxyPlugin',
    [ActionFunction.SWC]: 'SWCPlugin',
  },
};

export const BFFPluginName: Record<Framework, string> = {
  [Framework.Express]: 'ExpressBFFPlugin',
  [Framework.Koa]: 'KoaBFFPlugin',
};
