export type RemoveConsoleOptions = {
  exclude?: string[];
};

export interface WebBuilderPerformanceConfig {
  removeConsole?: boolean | RemoveConsoleOptions;
}
