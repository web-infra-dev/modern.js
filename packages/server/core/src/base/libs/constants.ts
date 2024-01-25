export const AGGRED_DIR = {
  mock: 'config/mock',
  server: 'server',
  api: 'api',
  shared: 'shared',
  lambda: 'lambda',
};

export const REPLACE_REG = {
  before: {
    head: '<head[^>]*>',
    body: '<body[^>]*>',
  },
  after: {
    head: '</head>',
    body: '</body>',
  },
};
