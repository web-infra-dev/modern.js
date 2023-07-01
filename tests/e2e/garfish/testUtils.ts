export const appInfo = {};

export const exampleInfo = {
  '@e2e/garfish-main': {
    port: 3001,
  },
  '@e2e/garfish-main-router-v6': {
    port: 4001,
  },
  '@e2e/garfish-dashboard-router-v6': {
    port: 4003,
  },
  '@e2e/garfish-dashboard': {
    port: 3002,
  },
  '@e2e/garfish-table': {
    port: 3003,
  },
};

type AppName = keyof typeof exampleInfo;

export const isDevelopment = process.env.NODE_ENV !== 'production';

export const getPublicPath = (appName: AppName) => {
  if (!exampleInfo[appName]) {
    throw Error(`unexpect appName ${appName}`);
  }
  const { port } = exampleInfo[appName];
  return `http://localhost:${port}/`;
};

export const getPort = (appName: AppName) => {
  if (!exampleInfo[appName]) {
    throw Error(`unexpect appName ${appName}`);
  }
  return exampleInfo[appName].port;
};

export const getAppInfo = (appName: AppName) => {
  if (!exampleInfo[appName]) {
    throw Error(`unexpect appName ${appName}`);
  }
  return exampleInfo[appName];
};
