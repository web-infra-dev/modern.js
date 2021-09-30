/* eslint-disable filenames/match-exported, node/no-unsupported-features/es-syntax */
import source from './dep-a';

const config = {
  source,
  tools: {
    babel: () => {
      /** empty */
    },
  },
};

export default config;
/* eslint-enable filenames/match-exported, node/no-unsupported-features/es-syntax */
