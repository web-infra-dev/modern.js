import { env } from 'node:process';
import { createAliESAFunction } from './bundles/modern-server';
import { deps } from './deps';

p_genPluginImportsCode;

let requestHandler = null;
let handlerCreationPromise = null;

async function initServer() {
  const routes = p_ROUTES;

  const dynamicProdOptions = p_dynamicProdOptions;

  const prodServerOptions = {
    pwd: '/',
    routes,
    disableCustomHook: true,
    appContext: {
      sharedDirectory: p_sharedDirectory,
      apiDirectory: p_apiDirectory,
      lambdaDirectory: p_lambdaDirectory,
      bffRuntimeFramework: p_bffRuntimeFramework,
      appDependencies: deps,
    },
    plugins: p_plugins,
    serverConfigPath: p_serverDirectory,
    ...dynamicProdOptions,
  };

  const requestHandler = await createAliESAFunction(prodServerOptions, env);

  return requestHandler;
}

async function createHandler() {
  if (!handlerCreationPromise) {
    handlerCreationPromise = (async () => {
      try {
        requestHandler = await initServer();
      } catch (error) {
        console.error('Error creating server:', error);
      }
    })();
  }
  await handlerCreationPromise;
  return requestHandler;
}

createHandler();

export default {
  async fetch(request) {
    if (!requestHandler) {
      await createHandler();
    }
    return requestHandler(request);
  },
};
