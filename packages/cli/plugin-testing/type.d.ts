
declare module '@modern-js/runtime/testing' {
  export * from '@modern-js/plugin-testing/dist/types/runtime-testing';
}

declare module '@modern-js/core' {
  interface UserConfig {
    testing?: import('@modern-js/testing').TestConfig;
  }

  interface ToolsConfig {
    jest?: import('@modern-js/testing').TestConfig['jest'];
  }
}
