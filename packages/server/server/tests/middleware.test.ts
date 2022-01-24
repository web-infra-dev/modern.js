import path from 'path';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { createServer, Server } from 'http';
import httpMocks from 'node-mocks-http';
import portfinder from 'portfinder';
import axios from 'axios';
import { createContext } from '../src/libs/context';
import { createStaticFileHandler } from '../src/libs/serve-file';
import { createProxyHandler } from '../src/libs/proxy';

describe('test middleware create factory', () => {
  describe('should create static-file handler correctly', () => {
    const middleware = createStaticFileHandler([
      {
        path: /static\/|upload\//,
        target: path.join(__dirname, './fixtures/hosting-files'),
      },
    ]);

    test('should get static file correctly', resolve => {
      const req = httpMocks.createRequest({
        path: '/static/index.js',
        eventEmitter: Readable,
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      const mockContext = createContext(req, res);
      res.on('finish', () => {
        expect(res._getBuffer().toString().trim()).toBe(
          "console.info('index.js');",
        );
        resolve();
      });

      middleware(mockContext, () => {
        throw new Error('should not happened');
      });
    });

    test('should miss static file correctly', resolve => {
      const req = httpMocks.createRequest({
        path: '/static/index.css',
        eventEmitter: Readable,
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      const mockContext = createContext(req, res);
      res.on('finish', () => {
        throw new Error('should not happened');
      });

      middleware(mockContext, () => {
        req.destroy();
        expect(true).toBeTruthy();
        resolve();
      });
    });
  });

  jest.setTimeout(1000 * 10);
  describe('should create proxy handler correctly', () => {
    test('should return null if no options', () => {
      expect(createProxyHandler(null as any)).toBeNull();
    });

    let sourceServerPort = 8080;
    let sourceServer: Server | null = null;
    beforeAll(async () => {
      let done: any;
      const promise = new Promise(resolve => (done = resolve));
      sourceServerPort = await portfinder.getPortPromise();
      sourceServer = createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.write(req.url?.slice(1));
        res.end();
      }).listen(sourceServerPort, done);
      return promise;
    });

    afterAll(() => {
      if (sourceServer) {
        sourceServer.close();
      }
    });

    test('should proxy correctly use simply options', async () => {
      const port = await portfinder.getPortPromise();
      const middlewares = createProxyHandler({
        '/simple': `http://localhost:${sourceServerPort}`,
      });
      const proxyHandler = middlewares![0];

      const server = createServer((req, res) => {
        const context = createContext(req, res);
        proxyHandler(context, () => {
          throw new Error('should not happened');
        });
      }).listen(port);

      try {
        const { data } = await axios.get(`http://localhost:${port}/simple`);
        expect(data).toBe('simple');
      } finally {
        server.close();
      }
    });

    test('should proxy correctly use simply obj options', async () => {
      const port = await portfinder.getPortPromise();
      const middlewares = createProxyHandler({
        '/simple-obj': {
          target: `http://localhost:${sourceServerPort}`,
        },
      });
      const proxyHandler = middlewares![0];

      const server = createServer((req, res) => {
        const context = createContext(req, res);
        proxyHandler(context, () => {
          throw new Error('should not happened');
        });
      }).listen(port);

      try {
        const { data } = await axios.get(`http://localhost:${port}/simple-obj`);
        expect(data).toBe('simple-obj');
      } finally {
        server.close();
      }
    });

    test('should proxy correctly use context options', async () => {
      const port = await portfinder.getPortPromise();
      const middlewares = createProxyHandler({
        context: '/context',
        target: `http://localhost:${sourceServerPort}`,
      });
      const proxyHandler = middlewares![0];

      const server = createServer((req, res) => {
        const context = createContext(req, res);
        proxyHandler(context, () => {
          throw new Error('should not happened');
        });
      }).listen(port);

      try {
        const { data } = await axios.get(`http://localhost:${port}/context`);
        expect(data).toBe('context');
      } finally {
        server.close();
      }
    });

    test('should proxy correctly use array options', async () => {
      const port = await portfinder.getPortPromise();
      const middlewares = createProxyHandler([
        {
          context: '/array',
          target: `http://localhost:${sourceServerPort}`,
        },
      ]);
      const proxyHandler = middlewares![0];

      const server = createServer((req, res) => {
        const context = createContext(req, res);
        proxyHandler(context, () => {
          throw new Error('should not happened');
        });
      }).listen(port);

      try {
        const { data } = await axios.get(`http://localhost:${port}/array`);
        expect(data).toBe('array');
      } finally {
        server.close();
      }
    });
  });
});
