export type {
  PresetEnvOptions,
  SharedBabelPresetReactOptions,
  AutomaticRuntimePresetReactOptions,
  ClassicRuntimePresetReactOptions,
  PresetReactOptions,
  BabelConfigUtils,
  BabelConfig,
  BabelOptions,
} from '@modern-js/types';

export interface IStyledComponentOptions {
  pure?: boolean;
  displayName?: boolean;
  ssr?: boolean;
  fileName?: boolean;
  meaninglessFileNames?: string[];
  minify?: boolean;
  transpileTemplateLiterals?: boolean;
  namespace?: string;
}
