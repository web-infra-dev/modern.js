export interface DevCommandOptions {
  port?: string;
  tsconfig?: string;
}

export interface BuildCommandOptions {
  clear: boolean;
  dts: boolean;
  watch: boolean;
  config?: string;
  platform?: boolean | string[];
  tsconfig?: string;
}
