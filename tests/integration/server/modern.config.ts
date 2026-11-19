import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
  server: {
    routes: { custom: { route: ['/a', '/b', '/main/:id'] } },
    ssrByEntries: {
      index: { forceCSR: true, mode: 'string' },
      custom: { mode: 'string' },
      monitors: true,
    },
    useJsonScript: true,
  },
});
