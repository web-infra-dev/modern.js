import { createServer, Server } from 'http';
import portfinder from 'portfinder';
import axios from 'axios';
import { createProxyHandler } from '../src/middlewares/proxy';

jest.setTimeout(1000 * 10);

describe('should create proxy handler correctly', () => {
  test('should return empty mid if no options', () => {
    const empty = createProxyHandler(null as any)[0];

    expect(
      empty(null as any, null as any, () => {
        // empty
      }),
    ).toBeUndefined();
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
    const proxyHandler = middlewares[0];

    const server = createServer((req, res) => {
      proxyHandler(req, res, () => {
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
    const proxyHandler = middlewares[0];

    const server = createServer((req, res) => {
      proxyHandler(req, res, () => {
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
    const proxyHandler = middlewares[0];

    const server = createServer((req, res) => {
      proxyHandler(req, res, () => {
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
    const proxyHandler = middlewares[0];

    const server = createServer((req, res) => {
      proxyHandler(req, res, () => {
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
