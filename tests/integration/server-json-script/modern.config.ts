import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
    state: false,
  },
  server: {
    ssr: true,
    useJsonScript: true,
  },
});
