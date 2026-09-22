import { applyBaseConfig } from '../../utils/applyBaseConfig';

// Plugin-level options of @rsbuild/plugin-less / plugin-sass / plugin-svgr,
// passed through `tools.*` as the full plugin options.
export default applyBaseConfig({
  server: {
    // string SSR: the fixture uses `src/App.tsx`, not convention-based routing
    ssr: {
      mode: 'string',
    },
  },
  tools: {
    less: {
      parallel: true,
      lessLoaderOptions: {
        lessOptions: {
          javascriptEnabled: false,
        },
      },
    },
    sass: {
      rewriteUrls: false,
    },
    svgr: {
      parallel: true,
      svgrOptions: {
        exportType: 'default',
      },
    },
  },
});
