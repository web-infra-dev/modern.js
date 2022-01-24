import garfish, { interfaces as GarfishInterfaces } from 'garfish';

export type Options = typeof garfish.options;
export type ModulesInfo = Array<
  GarfishInterfaces.AppInfo & {
    Component?: React.ComponentType | React.ElementType;
    originInfo?: Record<string, unknown>;
  }
>;
export type ModuleInfo = ModulesInfo[number];

export type ModernConfig = {
  manifest: {
    modules?: ModulesInfo;
  };
  getAppList?: () => Promise<Array<GarfishInterfaces.AppInfo>>;
  LoadingComponent?: React.ComponentType | React.ElementType;
};

export type Config = Partial<Options> & ModernConfig;
