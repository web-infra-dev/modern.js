import { createEdgeOneFunction } from '@modern-js/prod-server/edgeone';
import { deps } from './deps';
import staticFilesList from './static-files-list.json' assert { type: 'json' };

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
    },
    plugins: p_plugins,
    serverConfigPath: p_serverDirectory,
    ...dynamicProdOptions,
  };

  const requestHandler = await createEdgeOneFunction(
    prodServerOptions,
    deps,
    staticFilesList,
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
      }
    })();
  }
  await handlerCreationPromise;
  return requestHandler;
}

export async function onRequest(ctx) {
  if (!requestHandler) {
    await createHandler(ctx.env);
  }
  return requestHandler(ctx);
}
