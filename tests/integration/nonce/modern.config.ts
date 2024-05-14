import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: true,
  },
  security: {
    nonce: 'test-nonce',
  },
});
