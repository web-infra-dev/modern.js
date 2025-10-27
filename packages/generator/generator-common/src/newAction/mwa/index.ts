import type { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../../locale';
import {
  ActionElement,
  ActionElementText,
  ActionFunction,
  ActionFunctionText,
  ActionType,
  ActionTypeQuestionText,
  ActionTypeText,
} from '../common';

export const MWAActionTypes = [ActionType.Element, ActionType.Function];

export const MWAActionFunctions = [
  ActionFunction.BFF,
  ActionFunction.SSG,
  ActionFunction.Polyfill,
];

export const MWAActionElements = [ActionElement.Entry, ActionElement.Server];

export const MWAActionTypesMap: Record<ActionType, string[]> = {
  [ActionType.Element]: MWAActionElements,
  [ActionType.Function]: MWAActionFunctions,
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
    },
  };
};

export const MWAActionFunctionsDevDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.SSG]: '@modern-js/plugin-ssg',
};

export const MWAActionFunctionsDependencies: Partial<
  Record<ActionFunction, string>
> = {
  [ActionFunction.BFF]: '@modern-js/plugin-bff',
  [ActionFunction.Polyfill]: '@modern-js/plugin-polyfill',
};

export const MWAActionFunctionsAppendTypeContent: Partial<
  Record<ActionFunction, string>
> = {};

export const MWANewActionGenerators: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Entry]: '@modern-js/entry-generator',
    [ActionElement.Server]: '@modern-js/server-generator',
  },
  [ActionType.Function]: {
    [ActionFunction.BFF]: '@modern-js/bff-generator',
    [ActionFunction.SSG]: '@modern-js/ssg-generator',
    [ActionFunction.Polyfill]: '@modern-js/dependence-generator',
  },
};

export const MWANewActionPluginName: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Server]: '',
  },
  [ActionType.Function]: {
    [ActionFunction.BFF]: 'bffPlugin',
    [ActionFunction.SSG]: 'ssgPlugin',
    [ActionFunction.Polyfill]: 'polyfillPlugin',
  },
};

export const MWANewActionPluginDependence: Record<
  ActionType,
  Record<string, string>
> = {
  [ActionType.Element]: {
    [ActionElement.Server]: '',
  },
  [ActionType.Function]: {
    [ActionFunction.BFF]: '@modern-js/plugin-bff',
    [ActionFunction.SSG]: '@modern-js/plugin-ssg',
    [ActionFunction.Polyfill]: '@modern-js/plugin-polyfill',
  },
};
