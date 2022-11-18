export interface MicroFrontend {
  enableHtmlEntry?: boolean;
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}

export type LegacyDeployUserConfig = {
  microFrontend?: boolean | MicroFrontend;
};
