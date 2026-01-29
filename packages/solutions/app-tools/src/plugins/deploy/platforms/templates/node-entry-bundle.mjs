import { createProdServer } from 'p_prodServerEntry';

const dependencies = p_genDepCode;

p_genPluginImportsCode;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const routes = p_ROUTES;

async function main() {
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
      dependencies,
    },
    plugins: p_plugins,
    serverConfigPath: p_serverDirectory,
    ...dynamicProdOptions,
  };

  const app = await createProdServer(prodServerOptions);
  const port = process.env.PORT || 8080;
  app.listen(
    {
      host: '::',
      port,
    },
    () => {
      console.log(
        `\x1b[32mServer is listening on http://[::]:${port}`,
        '\x1b[0m',
      );
    },
  );
}

main();
