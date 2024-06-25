import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { routerPlugin } from '@modern-js/plugin-router-v5';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export const tmpTest = (): CliPlugin<AppTools> => ({
  name: 'tmpTest',
  setup: () => {
    return {
      htmlPartials({ entrypoint, partials }) {
        if (entrypoint.entryName === 'sub') {
          partials.top.push('<script>window.abc = "hjk"</script>');
          partials.head.push('<script>console.log("abc")</script>');
          partials.body.push('<script>console.log(abc)</script>');
        }

        return { partials, entrypoint };
      },
    };
  },
});

export default applyBaseConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
    state: true,
  },
  source: {
    entries: {
      sub: './src/sub/pages',
      test: './src/test/App.tsx',
    },
  },
  server: {
    ssrByEntries: {
      test: true,
    },
  },
  html: {
    favicon: './static/a.icon',
    title: 'test-title',
  },
  plugins: [routerPlugin(), tmpTest()],
});
