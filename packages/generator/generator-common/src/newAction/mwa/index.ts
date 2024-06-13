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
  ActionTypeQuestionText,
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
  ActionFunction.SWC,
  ActionFunction.MicroFrontend,
  ActionFunction.Polyfill,
  ActionFunction.Proxy,
  ActionFunction.StorybookV7,
];

export const MWAActionElements = [ActionElement.Entry, ActionElement.Server];
export const MWAActionReactors = [ActionRefactor.ReactRouter5];

export const MWAActionTypesMap: Record<ActionType, string[]> = {
  [ActionType.Element]: MWAActionElements,
  [ActionType.Function]: MWAActionFunctions,
  [ActionType.Refactor]: MWAActionReactors,
};

export const getMWANewActionSchema = (): Schema => {
  return {
    type: 'object',
    properties: {
      actionType: {
        type: 'string',
        title: i18n.t(localeKeys.action.self),
        enum: MWAActionTypes.map(type => ({
          value: type,
          label: ActionTypeText[type](),
          type: ['string'],
        })),
      },
      [ActionType.Element]: {
        type: 'string',
        title: ActionTypeQuestionText[ActionType.Element](),
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
        title: ActionTypeQuestionText[ActionType.Function](),
        enum: MWAActionFunctions.map(func => ({
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
      [ActionType.Refactor]: {
        type: 'string',
        title: ActionTypeQuestionText[ActionType.Refactor](),
        enum: MWAActionReactors.map(refactor => ({
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
  [ActionFunction.StorybookV7]: '@modern-js/storybook',
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
    [ActionFunction.StorybookV7]: '@modern-js/storybook-next-generator',
    [ActionFunction.SSG]: '@modern-js/ssg-generator',
    [ActionFunction.Polyfill]: '@modern-js/dependence-generator',
    [ActionFunction.Proxy]: '@modern-js/dependence-generator',
    [ActionFunction.SWC]: '@modern-js/dependence-generator',
  },
  [ActionType.Refactor]: {
    [ActionRefactor.ReactRouter5]: '@modern-js/router-v5-generator',
  },
};

export const MWANewActionPluginName: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Server]: 'serverPlugin',
  },
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: 'tailwindcssPlugin',
    [ActionFunction.BFF]: 'bffPlugin',
    [ActionFunction.MicroFrontend]: 'garfishPlugin',
    [ActionFunction.SSG]: 'ssgPlugin',
    [ActionFunction.Polyfill]: 'polyfillPlugin',
    [ActionFunction.Proxy]: 'proxyPlugin',
    [ActionFunction.SWC]: 'swcPlugin',
  },
  [ActionType.Refactor]: {
    [ActionRefactor.ReactRouter5]: 'routerPlugin',
  },
};

export const MWANewActionPluginDependence: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Server]: '@modern-js/plugin-server',
  },
  [ActionType.Function]: {
    [ActionFunction.TailwindCSS]: '@modern-js/plugin-tailwindcss',
    [ActionFunction.BFF]: '@modern-js/plugin-bff',
    [ActionFunction.MicroFrontend]: '@modern-js/plugin-garfish',
    [ActionFunction.SSG]: '@modern-js/plugin-ssg',
    [ActionFunction.Polyfill]: '@modern-js/plugin-polyfill',
    [ActionFunction.Proxy]: '@modern-js/plugin-proxy',
    [ActionFunction.SWC]: '@modern-js/plugin-swc',
  },
  [ActionType.Refactor]: {
    [ActionRefactor.ReactRouter5]: '@modern-js/plugin-router-v5',
  },
};

export const BFFPluginName: Record<Framework, string> = {
  [Framework.Express]: 'expressPlugin',
  [Framework.Koa]: 'koaPlugin',
};

export const BFFPluginDependence: Record<Framework, string> = {
  [Framework.Express]: '@modern-js/plugin-express',
  [Framework.Koa]: '@modern-js/plugin-koa',
};
