import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNetlifyFunction } from '@modern-js/prod-server/netlify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      bffRuntimeFramework: p_bffRuntimeFramework,
    },
    plugins: p_plugins,
    serverConfigPath: p_serverDirectory,
    ...dynamicProdOptions,
  };

  const requestHandler = await createNetlifyFunction(prodServerOptions);

  return requestHandler;
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

export default async (request, context) => {
  if (!requestHandler) {
    await createHandler();
  }
  return requestHandler(request, context);
};
