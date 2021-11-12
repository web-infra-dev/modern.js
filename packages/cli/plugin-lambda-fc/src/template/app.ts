export type EntryOptions = {
  config: Record<string, any>;
  pwd?: string;
  plugins?: string[];
};

export default (options: EntryOptions) => `
  const { Server: ServerProxy } = require('@webserverless/fc-express');
  const modernServer = require('@modern-js/server');
  const express = require('express');

  const server = express();
  const proxy = new ServerProxy(server);

  const httpHandler = async function (req, res, context) {
    proxy.httpProxy(req, res, context);
  };

  const initializer = async function (context, callback) {
    const app = await modernServer.default({
      pwd: __dirname,
      config: ${JSON.stringify(options.config)},
    });
    const handler = app.getRequestHandler();
    server.get('*', (req, res) => handler(req, res));
    callback(null, '');
  };

  module.exports.handler = httpHandler;
  module.exports.Initializer = initializer;
  `;
