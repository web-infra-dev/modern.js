import { BuilderPlugin } from '../types';
import { awaitableGetter, Plugins } from '@modern-js/builder-shared';

const useLegacyTransform = () =>
  Boolean(process.env.INTERNAL_USE_RSPACK_TRANSFORM_LEGACY);

export const applyDefaultPlugins = (plugins: Plugins) =>
  awaitableGetter<BuilderPlugin>([
    import('../plugins/transition').then(m => m.builderPluginTransition()),
    import('../plugins/basic').then(m => m.builderPluginBasic()),
    plugins.antd(),
    plugins.arco(),
    plugins.entry(),
    // plugins.cache(),
    plugins.target(),
    import('../plugins/output').then(m => m.builderPluginOutput()),
    plugins.devtool(),
    import('../plugins/resolve').then(m => m.builderPluginResolve()),
    plugins.fileSize(),
    // cleanOutput plugin should before the html plugin
    plugins.cleanOutput(),
    plugins.font(),
    plugins.image(),
    plugins.media(),
    plugins.svg(),
    plugins.html(),
    plugins.tsChecker(),
    plugins.wasm(),
    plugins.moment(),
    plugins.nodeAddons(),
    // pug plugin should after html plugin
    import('../plugins/pug').then(m => m.builderPluginPug()),
    plugins.define(),
    import('../plugins/css').then(m => m.builderPluginCss()),
    import('../plugins/less').then(m => m.builderPluginLess()),
    import('../plugins/sass').then(m => m.builderPluginSass()),
    import('../plugins/minimize').then(m => m.builderPluginMinimize()),
    import('../plugins/manifest').then(m => m.builderPluginManifest()),
    plugins.rem(),
    import('../plugins/hmr').then(m => m.builderPluginHMR()),
    import('../plugins/progress').then(m => m.builderPluginProgress()),
    useLegacyTransform()
      ? import('../plugins/swc-old').then(m => m.builderPluginSwc())
      : import('../plugins/swc').then(m => m.builderPluginSwc()),
    import('../plugins/babel').then(m => m.builderPluginBabel()),
    useLegacyTransform()
      ? import('../plugins/react-old').then(m => m.builderPluginReact())
      : import('../plugins/react').then(m => m.builderPluginReact()),
    plugins.externals(),
    plugins.toml(),
    plugins.yaml(),
    plugins.splitChunks(),
    plugins.startUrl(),
    plugins.inlineChunk(),
    plugins.bundleAnalyzer(),
    plugins.assetsRetry(),
    plugins.checkSyntax(),
    plugins.networkPerformance(),
    plugins.preloadOrPrefetch(),
    plugins.performance(),
    import('../plugins/rspack-profile').then(m =>
      m.builderPluginRspackProfile(),
    ),
    import('../plugins/fallback').then(m => m.builderPluginFallback()), // fallback should be the last plugin
  ]);
