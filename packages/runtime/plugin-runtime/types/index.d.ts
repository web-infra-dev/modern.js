/// <reference types='@modern-js/plugin-state/types' />

declare module 'http' {
  interface ServerResponse {
    locals: Record<string, any>;
  }
}
