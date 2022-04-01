/// <reference types='@modern-js/module-tools/types' />
/// <reference types='@modern-js/plugin-testing/types' />

declare module '@serverless/components' {
  async function runComponents(): Promise<void>;
  export = { runComponents };
}
