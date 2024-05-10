import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: true,
  },
  dev: {
    // for test that https is working in the dev
    https: true,
  },
  security: {
    nonce: 'test-nonce',
  },
});
