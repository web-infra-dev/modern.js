import { createCFWorkersFunction } from './bundles/modern-server';
import { deps } from './deps';

p_genPluginImportsCode;

let requestHandler = null;
let handlerCreationPromise = null;

async function initServer(env) {
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

  const requestHandler = await createCFWorkersFunction(prodServerOptions, env);

  return requestHandler;
}

async function createHandler(env) {
  if (!handlerCreationPromise) {
    handlerCreationPromise = (async () => {
      try {
        requestHandler = await initServer(env);
      } catch (error) {
        console.error('Error creating server:', error);
      }
    })();
  }
  await handlerCreationPromise;
  return requestHandler;
}

export default {
  async fetch(request, env, ctx) {
    if (!requestHandler) {
      await createHandler(env);
    }
    return requestHandler(request, env, ctx);
  },
};
