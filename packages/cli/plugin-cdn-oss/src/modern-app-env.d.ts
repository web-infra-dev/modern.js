/// <reference types='@modern-js/module-tools' />
/// <reference types='@modern-js/plugin-testing/type' />

declare module '@alicloud/fun/lib/commands/config' {
  async function config(): Promise<void>;
  export = config;
}
