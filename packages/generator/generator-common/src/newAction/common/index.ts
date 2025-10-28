import { i18n, localeKeys } from '../../locale';

export enum ActionType {
  Function = 'function',
  Element = 'element',
}

export enum ActionElement {
  Entry = 'entry',
  Server = 'server',
}

export enum ActionFunction {
  BFF = 'bff',
  I18n = 'i18n',
  SSG = 'ssg',
  Polyfill = 'polyfill',
}

export const ActionTypeText: Record<ActionType, () => string> = {
  [ActionType.Function]: () => i18n.t(localeKeys.action.function.self),
  [ActionType.Element]: () => i18n.t(localeKeys.action.element.self),
};

export const ActionTypeQuestionText: Record<ActionType, () => string> = {
  [ActionType.Function]: () => i18n.t(localeKeys.action.function.question),
  [ActionType.Element]: () => i18n.t(localeKeys.action.element.question),
};

export const ActionElementText: Record<ActionElement, () => string> = {
  [ActionElement.Entry]: () => i18n.t(localeKeys.action.element.entry),
  [ActionElement.Server]: () => i18n.t(localeKeys.action.element.server),
};

export const ActionFunctionText: Record<ActionFunction, () => string> = {
  [ActionFunction.BFF]: () => i18n.t(localeKeys.action.function.bff),
  [ActionFunction.I18n]: () => i18n.t(localeKeys.action.function.i18n),
  [ActionFunction.SSG]: () => i18n.t(localeKeys.action.function.ssg),
  [ActionFunction.Polyfill]: () => i18n.t(localeKeys.action.function.polyfill),
};

export const ActionTypeTextMap: Record<
  ActionType,
  Record<string, () => string>
> = {
  [ActionType.Element]: ActionElementText,
  [ActionType.Function]: ActionFunctionText,
};
