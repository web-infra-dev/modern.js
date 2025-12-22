import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'string',
    },
  },
  source: {
    enableAsyncEntry: true,
  },
});
