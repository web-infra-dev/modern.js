/// <reference types='@modern-js/module-tools/types' />
/// <reference types='@modern-js/plugin-testing/types' />

declare module '@alicloud/fun/lib/commands/config' {
  async function config(): Promise<void>;
  export = config;
}
