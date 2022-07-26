declare module 'global';
declare module '@modern-js/runtime/model' {
  const effects: any;
  const immer: any;
  const autoActions: any;
  const devtools: any;
}

declare module '@modern-js/runtime/plugins' {
  export { state } from '@modern-js/runtime/state';
  export { router } from '@modern-js/runtime/router';
}
