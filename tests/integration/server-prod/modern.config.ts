import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: false,
    state: false,
  },
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
});
