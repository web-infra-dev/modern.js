import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    state: true,
  },
  source: {
    enableAsyncEntry: true,
  },
});
