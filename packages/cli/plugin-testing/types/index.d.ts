import "@testing-library/react"
import "@testing-library/jest-dom"
import "../dist/types/runtime-testing"

declare module '@modern-js/runtime/testing' {
  export * from '@testing-library/react';
  export { renderApp, createStore, testBff } from '../dist/types/runtime-testing';
}
