import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: true,
  },
  dev: {
    lazyCompilation: { imports: true, entries: false },
  },
});
