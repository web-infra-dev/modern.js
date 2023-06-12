export type ExportsModuleRules =
  | string
  | Record<string, string>
  | Record<string, string | Record<string, string>>;

export interface ExportsConfig {
  [modulePath: string]: ExportsModuleRules;
}
