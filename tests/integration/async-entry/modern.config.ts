import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  source: {
    enableAsyncEntry: true,
  },
});
