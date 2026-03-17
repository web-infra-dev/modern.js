const fs = require('node:fs/promises');
const path = require('node:path');
const { createProdServer } = require('@modern-js/prod-server');

p_genPluginImportsCode;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

let requestHandler = null;
let handlerCreationPromise = null;

async function loadRoutes(routeFilepath) {
  try {
    await fs.access(routeFilepath);
    const content = await fs.readFile(routeFilepath, 'utf-8');
    const routeSpec = JSON.parse(content);
    return routeSpec.routes || [];
  } catch (error) {
    console.warn(
      'route.json not found or invalid, continuing with empty routes.',
    );
    return [];
  }
}

async function initServer() {
  const routeFilepath = path.join(__dirname, p_ROUTE_SPEC_FILE);
  const routes = await loadRoutes(routeFilepath);

  const dynamicProdOptions = p_dynamicProdOptions;

  const prodServerOptions = {
    pwd: __dirname,
    routes,
    disableCustomHook: true,
    appContext: {
      sharedDirectory: p_sharedDirectory,
      apiDirectory: p_apiDirectory,
      lambdaDirectory: p_lambdaDirectory,
    },
    plugins: p_plugins,
    serverConfigPath: p_serverDirectory,
    ...dynamicProdOptions,
  };
  const app = await createProdServer(prodServerOptions);

  return app.getRequestListener();
}

async function createHandler() {
  if (!handlerCreationPromise) {
    handlerCreationPromise = (async () => {
      try {
        requestHandler = await initServer();
      } catch (error) {
        console.error('Error creating server:', error);
        process.exit(1);
      }
    })();
  }
  await handlerCreationPromise;
  return requestHandler;
}

createHandler();

const handler = async (req, res) => {
  if (!requestHandler) {
    await createHandler();
  }
  return requestHandler(req, res);
};

module.exports = handler;
