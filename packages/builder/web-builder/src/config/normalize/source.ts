import { SourceConfig, SourceFinalConfig } from 'src/types/config/source';

export const sourceNormalizer = (
  config: SourceConfig | void,
): SourceFinalConfig => config || {};

export default sourceNormalizer;
