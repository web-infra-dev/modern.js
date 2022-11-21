import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderHtmlConfig = Required<BuilderConfig>['html'];

export type HtmlUserConfig = BuilderHtmlConfig;

export type HtmlNormalizedConfig = HtmlUserConfig;
