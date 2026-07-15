import { appTools, defineConfig } from '@modern-js/app-tools';

// WRONG: only the title is in framework config; the meta tag was added via
// runtime Helmet in the page component (not emitted into built HTML).
export default defineConfig({
  plugins: [appTools()],
  html: {
    title: 'Eval App',
  },
});
