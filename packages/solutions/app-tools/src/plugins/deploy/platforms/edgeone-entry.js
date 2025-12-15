import path from 'node:path';
import { createEdgeOneFunction } from '@modern-js/prod-server/edgeone';

p_genPluginImportsCode;

let requestHandler = null;
let handlerCreationPromise = null;

const { deps } = require('./deps');
const staticFilesList = require('./static-files-list.json');

async function initServer(env) {
  const routes = p_ROUTES;

  const dynamicProdOptions = p_dynamicProdOptions;

  const prodServerOptions = {
    pwd,
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

  const requestHandler = await createEdgeOneFunction(
    prodServerOptions,
    deps,
    env,
  );

  return requestHandler;
}

async function createHandler(env) {
  if (!handlerCreationPromise) {
    handlerCreationPromise = (async () => {
      try {
        requestHandler = await initServer(env);
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

export async function onRequest(ctx) {
  if (!requestHandler) {
    await createHandler(ctx.env);
  }
  return requestHandler(ctx);
}
