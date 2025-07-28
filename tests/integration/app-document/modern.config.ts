import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export const tmpTest = (): CliPlugin<AppTools> => ({
  name: 'tmpTest',
  setup: api => {
    api.modifyHtmlPartials(({ entrypoint, partials }) => {
      if (entrypoint.entryName === 'sub') {
        partials.top.append('<script>window.abc = "hjk"</script>');
        partials.head.append('<script>console.log("abc")</script>');
        partials.body.append('<script>console.log(abc)</script>');
      }
    });
  },
});

export default applyBaseConfig({
  runtime: {
    router: true,
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
  plugins: [tmpTest()],
});
