import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    useJsonScript: true,
    ssr: {
      mode: 'stream',
    },
  },
});
