import garfish, { interfaces } from 'garfish';

export type Options = typeof garfish.options;
export type ModulesInfo = Array<
  interfaces.AppInfo & {
    Component?: React.FC<any>;
    originInfo?: Record<string, unknown>;
  }
>;
export type ModuleInfo = ModulesInfo[number];

export type Config = Partial<Options> & {
  manifest: { modules: ModulesInfo | string };
  LoadingComponent?: React.ComponentType | React.ElementType;
};
