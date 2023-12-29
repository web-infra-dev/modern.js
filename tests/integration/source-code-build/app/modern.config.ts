import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    state: true,
  },
  experiments: {
    sourceBuild: true,
  },
});
