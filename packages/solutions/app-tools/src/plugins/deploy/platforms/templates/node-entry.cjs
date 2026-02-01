const fs = require('node:fs/promises');
const path = require('node:path');
const { createProdServer } = require('@modern-js/prod-server');

p_genPluginImportsCode;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

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

async function main() {
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
