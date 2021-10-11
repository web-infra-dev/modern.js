import '@modern-js/core';

declare module '@modern-js/core' {
  interface ToolsConfig {
    tailwind?:
      | Record<string, any>
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      | ((options: Record<string, any>) => Record<string, any> | void);
  }
}
