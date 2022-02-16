import '@modern-js/core';
import "@testing-library/react"
import "@testing-library/jest-dom"
import "./dist/types/runtime-testing"

declare module '@modern-js/runtime/testing' {
  export * from '@testing-library/react';
  export { renderApp, createStore, testBff } from './dist/types/runtime-testing';
}

declare module '@modern-js/core' {
  interface UserConfig {
    testing?: import('@modern-js/testing').TestConfig;
  }

  interface ToolsConfig {
    jest?: import('@modern-js/testing').TestConfig['jest'];
  }
}
