import { Options } from 'sass';
import '@modern-js/core';

declare module '@modern-js/core' {
  interface ToolsConfig {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    sass?: Options | ((options: Options) => Options | void);
  }
}
