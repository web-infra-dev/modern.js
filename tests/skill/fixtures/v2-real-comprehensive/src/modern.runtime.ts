import { configure } from '@modern-js/plugin-bff/client';
import { defineRuntimeConfig } from '@modern-js/runtime';

configure({ allowedHeaders: ['x-fixture-id'] });

export default defineRuntimeConfig({
  router: {
    supportHtml5History: true,
  },
});
