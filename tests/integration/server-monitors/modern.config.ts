import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: true,
  },
  runtime: {
    router: true,
    state: false,
  },
});
