export const appInfo = {};

export const exampleInfo = {
  '@cypress-test/garfish-main': {
    port: 3001,
    homeTitle: 'Main Home page',
  },
  '@cypress-test/garfish-dashboard': {
    port: 3002,
  },
  '@cypress-test/garfish-table': {
    port: 3003,
  },
};

export const isDevelopment = process.env.NODE_ENV !== 'production';
export const getPublicPath = appName => {
  if (!exampleInfo[appName]) {
    throw Error(`unexpect appName ${appName}`);
  }
  const { port } = exampleInfo[appName];
  const { publicPath } = exampleInfo[appName];
  return !isDevelopment ? publicPath : `//localhost:${port}/`;
};

export const getPort = appName => {
  if (!exampleInfo[appName]) {
    throw Error(`unexpect appName ${appName}`);
  }
  return exampleInfo[appName].port;
};

export const getAppInfo = appName => {
  if (!exampleInfo[appName]) {
    throw Error(`unexpect appName ${appName}`);
  }
  return exampleInfo[appName];
};
