import type { RuntimePlugin } from '@modern-js/runtime';
import { StyledCollector } from './string/styledComponent';

export const styledComponentsPlugin = (): RuntimePlugin => ({
  name: '@modern-js/plugin-styled-components',
  setup(api) {
    api.extendStringSSRCollectors(({ chunkSet }) => {
      return new StyledCollector(chunkSet);
    });
  },
});
