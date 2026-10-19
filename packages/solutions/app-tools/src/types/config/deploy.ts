export interface MicroFrontend {
  /**
   * Specifies whether to enable the HTML entry.
   * When set to `true`, the current child application will be externalized for `react` and `react-dom`.
   * @default true
   */
  enableHtmlEntry?: boolean;
  /**
   * Specifies whether to use the external base library.
   * @default false
   */
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}

export interface DeployUserConfig {
  /**
   * Used to configure micro-frontend sub-application information.
   * @default false
   */
  microFrontend?: boolean | MicroFrontend;
  /**
   * Names of packages that are copied to the deploy output in full,
   * instead of only the files reached by the dependency trace.
   * Use it for a package the trace cannot see completely — for example one
   * that the bundle only imports through subpaths (`zod/v3`), whose root
   * entry point would otherwise be missing from the output node_modules.
   * @default []
   */
  copyWholePackages?: string[];
  worker?: {
    ssr?: boolean;
  };
}
