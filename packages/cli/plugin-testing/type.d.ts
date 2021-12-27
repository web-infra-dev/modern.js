declare module '@modern-js/runtime/testing' {
  export * from '@testing-library/react';
  export { renderApp, createStore } from '@modern-js/plugin-testing';
}

declare module '@modern-js/core' {
  interface UserConfig {
    testing?: import('@modern-js/testing').TestConfig;
  }

  interface ToolsConfig {
    jest?: import('@modern-js/testing').TestConfig['jest'];
  }
}
