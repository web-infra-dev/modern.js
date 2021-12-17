import { getRequireCode, getPluginsCode } from './utils';

export const web = (plugins: string[]) => {
  const requireCode = getRequireCode(plugins);
  const pluginsCode = getPluginsCode(plugins);

  return `// web-server/bootstrap.js
process.env.NODE_ENV = 'production'
const server = require('@modern-js/server').default;
${requireCode}

async function main() {
  const config = {
    server: {
      port: 8080,
    },
    output: {
      path: '.',
    },
  };

  const ssrProxyPort = process.env.SSR_SERVER_PORT || config.server.port + 1;
  const apiProxyPort = process.env.API_SERVER_PORT || config.server.port + 2;

  const app = await server({
    config,
    pwd: __dirname,
    plugins: ${pluginsCode},
    webOnly: true,
    proxyTarget: {
      ssr: process.env.SSR_TARGET || \`localhost:$\{ssrProxyPort}\`,
      api: process.env.API_TARGET || \`localhost:$\{apiProxyPort}\`
    }
  });

  const port = process.env.PORT || config.server.port;
  app.listen(port);
}
main();`;
};

export const ssr = () =>
  `// ssr-server/bootstrap.js
process.env.NODE_ENV = 'production'
const server = require('@modern-js/server').default;

async function main() {
  const config = {
    server: {
      port: 8080,
    },
    output: {
      path: '.',
    },
  };

  const app = await server({
    config,
    pwd: __dirname,
    ssrOnly: true,
    plugins: [],
  });
  const port = process.env.PORT || config.server.port + 1;
  app.listen(port);
}

main();`;

export const api = (plugins: string[]) => {
  const requireCode = getRequireCode(plugins);
  const pluginsCode = getPluginsCode(plugins);

  return `// api-server/bootstrap.js
process.env.NODE_ENV = 'production';
const server = require('@modern-js/server').default;
${requireCode}

async function main() {
  const config = {
    server: {
      port: 8080,
    },
    output: {
      path: '.',
    },
  };

  const app = await server({
    config,
    pwd: __dirname,
    apiOnly: true,
    plugins: ${pluginsCode},
  });
  const port = process.env.PORT || config.server.port + 2;
  app.listen(port);
}

main();`;
};
