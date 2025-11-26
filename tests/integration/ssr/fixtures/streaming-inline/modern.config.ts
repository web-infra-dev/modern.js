import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    useJsonScript: true,
    ssr: {
      mode: 'stream',
    },
  },
});
