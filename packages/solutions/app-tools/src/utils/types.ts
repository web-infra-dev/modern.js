export type DevOptions = {
  entry?: string[] | boolean;
  config?: string;
  apiOnly?: boolean;
  analyze?: boolean;
};

export type BuildOptions = {
  config?: string;
  analyze?: boolean;
};

export type DeployOptions = {
  config?: string;
};

export type StartOptions = {
  apiOnly?: boolean;
};

export type InspectOptions = {
  env?: string;
  output?: string;
  console?: boolean;
  verbose?: boolean;
};
