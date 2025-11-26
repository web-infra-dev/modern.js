import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
});
