import { defineRuntimeConfig } from '@modern-js/runtime';
import { createMockSdkLoader } from './mock-sdk';
import { createStarlingWrapper } from './starlingWrapper';

const starlingWrapper = createStarlingWrapper();

export default defineRuntimeConfig({
  i18n: {
    i18nInstance: starlingWrapper,
    initOptions: {
      backend: {
        sdk: createMockSdkLoader(),
      },
    },
  },
});
