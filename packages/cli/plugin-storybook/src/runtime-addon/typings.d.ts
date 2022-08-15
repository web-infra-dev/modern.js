declare module 'global';
declare module '@modern-js/runtime/model' {
  const effects: any;
  const immer: any;
  const autoActions: any;
  const devtools: any;
}

declare module '@modern-js/runtime/plugins' {
  export { default as state } from '@modern-js/runtime/runtime-state';
  export { default as router } from '@modern-js/runtime/runtime-router';
}
