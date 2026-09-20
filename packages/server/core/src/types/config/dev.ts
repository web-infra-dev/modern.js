export interface DevUserConfig {
  assetPrefix?: string;
  /**
   * Customize the directory containing the Mock API entry file.
   * Relative paths are resolved from the application directory.
   * @default './config/mock'
   */
  mockDir?: string;
}

export type DevNormalizedConfig = DevUserConfig;
