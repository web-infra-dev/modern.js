export interface MicroFrontend {
  enableHtmlEntry?: boolean;
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}

export interface DeployUserConfig {
  microFrontend?: boolean | MicroFrontend;
}

export type DeployNormalizedConfig = DeployUserConfig;
