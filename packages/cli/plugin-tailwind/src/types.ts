import '@modern-js/core';

declare module '@modern-js/core' {
  interface ToolsConfig {
    tailwindcss?:
      | Record<string, any>
      | ((options: Record<string, any>) => Record<string, any> | void);
  }
  interface SourceConfig {
    designSystem?: Record<string, any>;
  }
}
