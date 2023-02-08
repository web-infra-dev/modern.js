import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RsBuilderConfig } from '@modern-js/builder-rspack-provider';
import { UnwrapBuilderConfig } from '../utils';

export type { SharedHtmlConfig } from '@modern-js/builder-shared';
export type HtmlUserConfig = UnwrapBuilderConfig<BuilderConfig, 'html'>;
export type RsHtmlUserConfig = UnwrapBuilderConfig<RsBuilderConfig, 'html'>;
