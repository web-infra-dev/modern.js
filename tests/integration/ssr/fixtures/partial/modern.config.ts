import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssrByRouteIds: ['one_b/page'],
    ssr: true,
  },
});
