// Copied from https://github.com/web-infra-dev/swc-plugins/blob/main/types/index.d.ts#L34
// But remove all function type, the reason is deadlock.

// Exposed to user, to keep this the same with babel-plugin-import
export interface ImportItem {
  libraryName: string;
  libraryDirectory?: string;

  customName?: string;
  customStyleName?: string;

  styleLibraryDirectory?: string;
  style?: boolean | 'css' | string;

  // Personally think camel2DashComponentName is a bad name as transformToDefaultImport uses differently
  // But for compatibility, both are valid
  camelToDashComponentName?: boolean; // default to true
  camel2DashComponentName?: boolean; // default to true

  transformToDefaultImport?: boolean;

  ignoreEsComponent?: string[];
  ignoreStyleComponent?: string[];
}
