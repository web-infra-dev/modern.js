import { URL } from 'url';
import path from 'path/posix';
import { execSync } from 'child_process';
import { logger } from '@modern-js/builder-shared';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';
import { version } from './package.json';

const commitShort = execSync('git rev-parse --short=10 HEAD').toString().trim();
if (!commitShort.match(/^\w{10}$/)) {
  throw new Error("Can't resolve git commit hash.");
}

const basename = new URL(process.env.DEPLOY_HOST || 'https://modernjs.dev');
if (process.env.BASENAME === 'version' || !process.env.BASENAME) {
  basename.pathname = `/devtools/${version}`;
} else if (process.env.BASENAME === 'commit') {
  basename.pathname = `/devtools/${commitShort}`;
} else if (process.env.BASENAME === 'false') {
  basename.pathname = '/devtools';
} else {
  basename.pathname = path.resolve('/devtools', process.env.BASENAME);
}

logger.info(
  `Access client:`,
  `${basename.href}?src=ws://localhost:8080/_modern_js/devtools/rpc`,
);

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: basename.pathname,
    },
  },
  dev: {
    port: 8780,
    assetPrefix: basename.pathname,
    proxy: {
      [basename.href]: new URL(basename.pathname, 'http://localhost:8780').href,
    },
  },
  source: {
    preEntry: [require.resolve('modern-normalize/modern-normalize.css')],
    globalVars: {
      'process.env.PKG_VERSION': `${version}-${commitShort}`,
    },
  },
  output: {
    assetPrefix: basename.href,
    enableCssModuleTSDeclaration: true,
  },
  tools: {
    devServer: {
      client: {
        host: 'localhost',
        protocol: 'ws',
      },
    },
  },
  html: {},
  plugins: [
    appTools({
      bundler: 'experimental-rspack',
    }),
    proxyPlugin(),
  ],
});
