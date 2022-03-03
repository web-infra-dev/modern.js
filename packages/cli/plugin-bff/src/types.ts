import '@modern-js/core';

declare module '@modern-js/core' {
  interface UserConfig {
    bff?: {
      prefix?: string;
      requestCreator?: string;
      fetcher?: string;
      proxy: Record<string, any>;
    };
  }
}
