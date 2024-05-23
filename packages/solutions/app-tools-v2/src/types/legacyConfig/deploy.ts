export interface MicroFrontend {
  enableHtmlEntry?: boolean;
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}

export type DeployLegacyUserConfig = {
  microFrontend?: boolean | MicroFrontend;
};
