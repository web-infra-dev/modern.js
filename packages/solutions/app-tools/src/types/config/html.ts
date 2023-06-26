import { UnwrapBuilderConfig } from '../utils';
import type {
  WebpackBuilderConfig,
  RspackBuilderConfig,
} from '../../builder/shared';

export type { SharedHtmlConfig } from '@modern-js/builder-shared';
export type HtmlUserConfig = UnwrapBuilderConfig<WebpackBuilderConfig, 'html'>;
export type RsHtmlUserConfig = UnwrapBuilderConfig<RspackBuilderConfig, 'html'>;
