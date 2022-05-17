import '@modern-js/utils';

declare module '@modern-js/utils/compiled/commander' {
  export interface Command {
    $$libraryName: string;
  }
}

declare module '@modern-js/core' {
  interface OutputConfig {
    assetsPath: string;
    enableSourceMap: boolean;
    importStyle: ImportStyleType;
    packageMode: PackageModeType;
    packageFields: IPackageFields;
  }
  interface SourceConfig {
    jsxTransformRuntime: 'automatic' | 'classic';
  }

  interface NormalizedConfig {
    module?: Module[] | Module
  }
}

