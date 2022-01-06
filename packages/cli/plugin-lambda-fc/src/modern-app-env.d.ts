/// <reference types='@modern-js/module-tools' />
/// <reference types='@modern-js/plugin-testing/type' />

declare module '@alicloud/fun/lib/commands/deploy' {
  async function deploy(options: {
    template?: string;
    assumeYes?: boolean;
  }): Promise<void>;
  export = deploy;
}
