export type PluginStore = {
  readonly plugins: BuilderPlugin[];
  addPlugins: (plugins: BuilderPlugin[], options?: { before?: string }) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
};

export type BuilderPlugin<API = any> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};

type PluginMaterialsFn = () => Promise<BuilderPlugin>;

export type PluginMaterials = {
  cleanOutput: PluginMaterialsFn;
  startUrl: PluginMaterialsFn;
};
