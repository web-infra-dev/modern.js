export type DevOptions = {
  entry?: string[] | boolean;
  config?: string;
  apiOnly?: boolean;
  analyze?: boolean;
  envDir?: string;
};

export type BuildOptions = {
  config?: string;
  analyze?: boolean;
  watch?: boolean;
  envDir?: string;
};

export type DeployOptions = {
  config?: string;
  skipBuild?: boolean;
  envDir?: string;
};

export type StartOptions = {
  apiOnly?: boolean;
  envDir?: string;
};

export type InspectOptions = {
  env: string;
  output: string;
  verbose?: boolean;
};

export type InfoOptions = {
  config?: string;
  json?: boolean;
};
