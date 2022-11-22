declare module 'global';
declare module '@modern-js/runtime/model' {
  const state: any;
  const effects: any;
  const immer: any;
  const autoActions: any;
  const devtools: any;
  export { effects, immer, autoActions, devtools };
  export default state;
}

declare module '@modern-js/runtime/plugins' {
  export { default as state } from '@modern-js/runtime/model';
  export { default as router } from '@modern-js/runtime/router';
}
