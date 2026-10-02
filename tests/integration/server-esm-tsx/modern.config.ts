import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: { forceCSR: true, mode: 'string' },
  },
});
