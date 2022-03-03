import type { Options } from 'sass';
import '@modern-js/core';

type SassOptions = Options<'sync'> | Options<'async'>;

declare module '@modern-js/core' {
  interface ToolsConfig {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    sass?: SassOptions | ((options: SassOptions) => SassOptions | void);
  }
}
