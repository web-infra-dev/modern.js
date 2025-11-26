import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    routes: {
      index: {
        route: ['/a', '/b', '/main/:id'],
      },
    },
  },
});
