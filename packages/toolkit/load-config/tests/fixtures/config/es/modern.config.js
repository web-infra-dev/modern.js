/* eslint-disable filenames/match-exported */
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
/* eslint-enable filenames/match-exported */
