/// <reference types='@modern-js/module-tools/types' />
/// <reference types='@modern-js/plugin-testing/types' />

declare module '@alicloud/fun/lib/commands/deploy' {
  async function deploy(options: {
    template?: string;
    assumeYes?: boolean;
  }): Promise<void>;
  export = deploy;
}
