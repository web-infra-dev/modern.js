import type { SharedBuilderConfig } from '@modern-js/builder-shared';

export type BuilderHtmlConfig = Required<SharedBuilderConfig>['html'];

export type HtmlUserConfig = BuilderHtmlConfig;

export type HtmlNormalizedConfig = HtmlUserConfig;
