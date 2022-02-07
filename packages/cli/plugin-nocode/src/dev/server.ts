// const connectLivereload = require('connect-livereload');
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import reload from 'reload';
import { setReloadReturned } from '../utils';
import internalProxy from './proxy';
import { DEFAULT_HOST, DEFAULT_TYPE, DEFAULT_PORT } from './constants';
import { getIP } from './utils';

// internal use
const isTest = true;

const state: {
  server: any;
  sockets: any[];
  reloadReturned: any;
} = {
  server: null,
  sockets: [],
  reloadReturned: null,
};
export default ({
  appDirectory,
  internalDirectory,
  mode,
  fes = {},
  options = {},
}: {
  appDirectory: string;
  internalDirectory: string;
  mode: string;
  fes?: { type?: string };
  options?: { host?: string; port?: string; debug?: boolean };
}) => {
  const {
    host = DEFAULT_HOST,
    port = DEFAULT_PORT,
    debug: isDebug = false,
  } = options;
  const { type = DEFAULT_TYPE } = fes;
  const app = express();

  // Reload code here
  (reload as any)(app)
    // eslint-disable-next-line promise/prefer-await-to-then
    .then((reloadReturned: any) => {
      // reloadReturned is documented in the returns API in the README
      setReloadReturned(reloadReturned);
      // Reload started, start web server
      if (state.server?.listen) {
        state.server?.listen(app.get('port'), () => {
          console.info(`\n================================================`);

          console.info(`\n  nocode dev server is ready.`);
          console.warn(
            `\n    请打开线上编辑器选择任意应用，在URL上添加查询参数 \`debug=local:${port}-${mode}\` 开启本地调试模式`,
          );

          console.info(`\n================================================`);
        });
      }
    })
    // eslint-disable-next-line promise/prefer-await-to-then
    .catch((err: any) => {
      console.error(
        'Reload could not start, could not start server/sample app',
        err,
      );
    });

  internalProxy(
    app,
    { type, port: `${port}`, appDirectory, internalDirectory },
    { isTest, debug: isDebug },
  );
  if (isDebug) {
    app.use(
      require('morgan')(
        ':method :url :status :res[content-length] - :response-time ms',
      ),
    );
  }
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  app.use(bodyParser.json());

  app.set('port', port);
  state.server = http.createServer(app as any, () => {
    const ip = getIP();
    console.info(`\n================================================`);

    console.info(`\n  nocode dev server is ready.`);
    console.warn(`\n    Local:\t>>> http://${host}:${port}`);
    if (ip?.length) {
      console.warn(`\n    External:\t>>> http://${ip[0].address}:${port}`);
    }

    console.info(`\n================================================`);
  });
};

// module.exports.reloadReturned = state.reloadReturned;
export const close = () => {
  Object.keys(require.cache).forEach(id => {
    // const localId = id.substr(process.cwd().length - 1);
    // console.log('localId: ', localId);
    // Ignore anything not in server/app
    // if (!localId.match(/^\/src\//)) {
    //   return;
    // }
    // Remove the module from the cache
    delete require.cache[id];
  });

  state.sockets.forEach((socket, index) => {
    console.info('Destroying socket', index + 1);
    if (socket.destroyed === false) {
      socket.destroy();
    }
  });
  state.sockets = [];
  // console.log('state.server: ', state.server);
  state.server.close();
};
