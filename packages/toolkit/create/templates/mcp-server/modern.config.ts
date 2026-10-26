import { appTools } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';

export default {
  server: { port: Number(process.env.PORT ?? 8080) },
  plugins: [appTools(), bffPlugin()],
};
