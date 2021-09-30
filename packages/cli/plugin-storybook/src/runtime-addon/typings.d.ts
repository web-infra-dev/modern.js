declare module 'global';
declare module '@modern-js/runtime/model' {
  const effects: any;
  const immer: any;
  const autoActions: any;
  const devtools: any;
}

declare module '@modern-js/runtime/plugins' {
  export { state } from '@modern-js/plugin-state';
  // TODO: 导出正确的 router
  export { default as router } from '@modern-js/plugin-router';
}
