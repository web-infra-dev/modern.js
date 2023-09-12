import type { DevServerHttpsOptions } from '@modern-js/types';
import type { ArrayOrNot } from '../utils';

export type ProgressBarConfig = {
  id?: string;
};

export interface SharedDevConfig {
  /**
   * Whether to enable Hot Module Replacement.
   */
  hmr?: boolean;
  /**
   * Specify a port number for Dev Server to listen.
   */
  port?: number;
  /**
   * After configuring this option, you can enable HTTPS Dev Server, and disabling the HTTP Dev Server.
   */
  https?: DevServerHttpsOptions;
  /**
   * Used to set the page URL to open automatically when the Dev Server starts.
   * By default, no page will be opened.
   */
  startUrl?: boolean | string | string[];
  /**
   * Used to execute a callback function before opening the `startUrl`.
   * This config needs to be used together with `dev.startUrl`.
   */
  beforeStartUrl?: ArrayOrNot<() => Promise<void> | void>;
  /**
   * Set the URL prefix of static assets in the development environment,
   * similar to the [output.publicPath](https://webpack.js.org/guides/public-path/) config of webpack.
   */
  assetPrefix?: string | boolean;
  /**
   * Whether to display progress bar during compilation.
   */
  progressBar?: boolean | ProgressBarConfig;
  /**
   * Used to set the host of Dev Server.
   */
  host?: string;
}

export type NormalizedSharedDevConfig = SharedDevConfig &
  Required<Omit<SharedDevConfig, 'beforeStartUrl'>>;
