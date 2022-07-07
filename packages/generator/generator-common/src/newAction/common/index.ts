import { i18n, localeKeys } from '../../locale';

export enum ActionType {
  Function = 'function',
  Element = 'element',
  Refactor = 'refactor',
}

export enum ActionElement {
  Entry = 'entry',
  Server = 'server',
}

export enum ActionFunction {
  TailwindCSS = 'tailwindcss',
  Less = 'less',
  Sass = 'sass',
  BFF = 'bff',
  MicroFrontend = 'micro_frontend',
  Electron = 'electron',
  I18n = 'i18n',
  Test = 'test',
  E2ETest = 'e2e_test',
  Doc = 'doc',
  Storybook = 'storybook',
  RuntimeApi = 'runtimeApi',
  SSG = 'ssg',
  Polyfill = 'polyfill',
  Deploy = 'deploy',
  Proxy = 'proxy',
}

export enum ActionRefactor {
  BFFToApp = 'bff_to_app',
}

export const ActionTypeText: Record<ActionType, () => string> = {
  [ActionType.Function]: () => i18n.t(localeKeys.action.function.self),
  [ActionType.Element]: () => i18n.t(localeKeys.action.element.self),
  [ActionType.Refactor]: () => i18n.t(localeKeys.action.refactor.self),
};

export const ActionElementText: Record<ActionElement, () => string> = {
  [ActionElement.Entry]: () => i18n.t(localeKeys.action.element.entry),
  [ActionElement.Server]: () => i18n.t(localeKeys.action.element.server),
};

export const ActionFunctionText: Record<ActionFunction, () => string> = {
  [ActionFunction.TailwindCSS]: () =>
    i18n.t(localeKeys.action.function.tailwindcss),
  [ActionFunction.Less]: () => i18n.t(localeKeys.action.function.less),
  [ActionFunction.Sass]: () => i18n.t(localeKeys.action.function.sass),
  [ActionFunction.BFF]: () => i18n.t(localeKeys.action.function.bff),
  [ActionFunction.MicroFrontend]: () =>
    i18n.t(localeKeys.action.function.micro_frontend),
  [ActionFunction.Electron]: () => i18n.t(localeKeys.action.function.electron),
  [ActionFunction.I18n]: () => i18n.t(localeKeys.action.function.i18n),
  [ActionFunction.Test]: () => i18n.t(localeKeys.action.function.test),
  [ActionFunction.E2ETest]: () => i18n.t(localeKeys.action.function.e2e_test),
  [ActionFunction.Doc]: () => i18n.t(localeKeys.action.function.doc),
  [ActionFunction.Storybook]: () =>
    i18n.t(localeKeys.action.function.storybook),
  [ActionFunction.RuntimeApi]: () =>
    i18n.t(localeKeys.action.function.runtime_api),
  [ActionFunction.SSG]: () => i18n.t(localeKeys.action.function.ssg),
  [ActionFunction.Polyfill]: () => i18n.t(localeKeys.action.function.polyfill),
  [ActionFunction.Deploy]: () => i18n.t(localeKeys.action.function.deploy),
  [ActionFunction.Proxy]: () => i18n.t(localeKeys.action.function.proxy),
};

export const ActionRefactorText: Record<ActionRefactor, () => string> = {
  [ActionRefactor.BFFToApp]: () =>
    i18n.t(localeKeys.action.refactor.bff_to_app),
};

export const ActionTypeTextMap: Record<
  ActionType,
  Record<string, () => string>
> = {
  [ActionType.Element]: ActionElementText,
  [ActionType.Function]: ActionFunctionText,
  [ActionType.Refactor]: ActionRefactorText,
};
