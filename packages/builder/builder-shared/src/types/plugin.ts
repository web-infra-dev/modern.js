export type PluginStore = {
  readonly plugins: BuilderPlugin[];
  addPlugins: (plugins: BuilderPlugin[]) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
};

export type BuilderPlugin<API = unknown> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};
