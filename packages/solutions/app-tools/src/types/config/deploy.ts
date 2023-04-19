export interface MicroFrontend {
  enableHtmlEntry?: boolean;
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}

export interface DeployUserConfig {
  microFrontend?: boolean | MicroFrontend;
  worker?: {
    ssr?: boolean;
  };
}
