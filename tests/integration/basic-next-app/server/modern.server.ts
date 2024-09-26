import reactServerRegister from 'react-server-dom-webpack/node-register';
import {
  defineConfig,
  type RenderMiddleware,
} from '@modern-js/app-tools/server';
import rscServerPlugin from './serverPlugin';


reactServerRegister();
export default defineConfig({
  plugins: [rscServerPlugin()],
});
