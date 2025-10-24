import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: false,
    state: false,
  },
  server: {
    routes: {
      index: {
        route: ['/a', '/b', '/main/:id'],
      },
    },
  },
});
