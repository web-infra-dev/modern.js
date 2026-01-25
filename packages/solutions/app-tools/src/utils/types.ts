export type DevOptions = {
  entry?: string[] | boolean;
  config?: string;
  apiOnly?: boolean;
  analyze?: boolean;
};

export type BuildOptions = {
  config?: string;
  analyze?: boolean;
  watch?: boolean;
};

export type DeployOptions = {
  config?: string;
  skipBuild?: boolean;
};

export type StartOptions = {
  apiOnly?: boolean;
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
