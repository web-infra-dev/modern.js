import type { RuntimePlugin } from '@modern-js/runtime';
import { StreamStyledExtender } from './extender/stream';
import { StyledCollector } from './extender/string';

export const styledComponentsPlugin = (): RuntimePlugin => ({
  name: '@modern-js/plugin-styled-components',
  setup(api) {
    api.extendStringSSRCollectors(({ chunkSet }) => {
      return new StyledCollector(chunkSet);
    });

    api.extendStreamSSR(() => {
      return new StreamStyledExtender();
    });
  },
});
