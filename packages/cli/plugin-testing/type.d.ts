import { TestConfig } from '@modern-js/testing';

declare module '@modern-js/runtime/testing' {
  export * from '@testing-library/react';
  export { renderApp, createStore } from '@modern-js/plugin-testing';
}

declare module '@modern-js/core' {
  interface UserConfig {
    testing?: TestConfig;
  }

  interface ToolsConfig {
    jest?: TestConfig['jest'];
  }
}
