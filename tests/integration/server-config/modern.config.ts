import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: false,
    state: false,
  },
  server: {
    ssr: { forceCSR: true },
  },
});
