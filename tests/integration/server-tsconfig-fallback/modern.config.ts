import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

// Deliberately no `server.tsconfigPath` and no `tsconfig.server.json`: the
// framework has to fall back to the bundler-mode `tsconfig.json` and still
// emit CommonJS for api/, server/ and shared/.
export default applyBaseConfig({
  server: {
    ssr: { forceCSR: true, mode: 'string' },
  },
  plugins: [bffPlugin()],
});
