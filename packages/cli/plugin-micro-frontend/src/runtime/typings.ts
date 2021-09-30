import garfish from 'garfish';

export type Options = typeof garfish.options;
export type ModulesInfo = Required<Options>['apps'];
export type ModuleInfo = ModulesInfo[number];

export type Config = Partial<Options> & {
  manifest: { modules: ModulesInfo | string };
  LoadingComponent?: React.ComponentType | React.ElementType;
};
