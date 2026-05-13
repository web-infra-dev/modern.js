import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'string',
    },
  },
  source: {
    enableAsyncEntry: true,
    enableAsyncPreEntry: true,
    preEntry: ['./src/pre.ts'],
  },
});
