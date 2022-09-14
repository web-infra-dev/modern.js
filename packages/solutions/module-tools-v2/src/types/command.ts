export interface DevCommandOptions {
  port?: string;
}

export interface BuildCommandOptions {
  watch?: boolean;
  tsconfig?: string;
  platform?: boolean | string | string[];
  dts?: boolean;
  config?: string;
}
