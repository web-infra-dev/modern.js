import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    ssrByRouteIds: ['one_b/page'],
    ssr: true,
  },
});
