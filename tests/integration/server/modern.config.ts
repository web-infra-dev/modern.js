import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
  server: {
    // Inside a build asset directory, but its files are user files, not
    // build assets, even with a hash-like name.
    publicDir: './static/locales',
    routes: { custom: { route: ['/a', '/b', '/main/:id'] } },
    ssrByEntries: {
      index: { forceCSR: true, mode: 'string' },
      custom: { mode: 'string' },
      monitors: true,
    },
    useJsonScript: true,
  },
});
