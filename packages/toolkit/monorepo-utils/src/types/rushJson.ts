// Castrated version of RushConfigurationProject
export interface RushConfigurationProject {
  readonly packageName: string;
  // projectFolder is relative path
  readonly projectFolder: string;
}

export interface IRushConfig {
  projects?: RushConfigurationProject[];
}
