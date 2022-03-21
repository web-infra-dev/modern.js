import '@modern-js/core';

export type ProxyOptions = string | Record<string, string>;

declare module '@modern-js/core' {
  export interface DevConfig {
    proxy?: ProxyOptions;
  }
}
