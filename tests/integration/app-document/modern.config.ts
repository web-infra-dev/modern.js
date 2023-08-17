import {
  AppTools,
  appTools,
  CliPlugin,
  defineConfig,
} from '@modern-js/app-tools';
import { routerPlugin } from '@modern-js/plugin-router-v5';

const tmpTest = (): CliPlugin<AppTools> => ({
  name: 'tmpTest',
  setup: () => {
    return {
      htmlPartials({ entrypoint, partials }) {
        partials.top.push('<script>window.abc = "hjk"</script>');
        partials.head.push('<script>console.log("abc")</script>');
        partials.body.push('<script>console.log(abc)</script>');

        return { partials, entrypoint };
      },
    };
  },
});

export default defineConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
    state: true,
  },
  source: {
    entries: {
      sub: './src/sub/App.tsx',
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
  },
  output: {},
  plugins: [appTools(), routerPlugin(), tmpTest()],
});
