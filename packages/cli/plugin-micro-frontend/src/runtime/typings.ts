import garfish, { interfaces } from 'garfish';

export type Options = typeof garfish.options;
export type ModulesInfo = Array<
  interfaces.AppInfo & {
    Component?: React.FC<any>;
    originInfo?: Record<string, unknown>;
  }
>;
export type ModuleInfo = ModulesInfo[number];

export type ModernConfig = {
  manifest: {
    modules?: ModulesInfo;
  };
  getAppList?: () => Promise<Array<interfaces.AppInfo>>;
  LoadingComponent?: React.ComponentType | React.ElementType;
};

export type Config = Partial<Options> & ModernConfig;
