import { prettyInstructions } from '../src';

const mockNetworkInterfaces = {
  lo0: [
    {
      address: '127.0.0.1',
      netmask: '255.0.0.0',
      family: 'IPv4',
      mac: '00:00:00:00:00:00',
      internal: true,
      cidr: '127.0.0.1/8',
    },
  ],
  en5: [
    {
      address: 'fe80::aede:48ff:fe00:1122',
      netmask: 'ffff:ffff:ffff:ffff::',
      family: 'IPv6',
      mac: 'ac:de:48:00:11:22',
      internal: false,
      cidr: 'fe80::aede:48ff:fe00:1122/64',
      scopeid: 4,
    },
  ],
  en0: [
    {
      address: '11.11.111.11',
      netmask: '255.255.252.0',
      family: 'IPv4',
      mac: '90:9c:4a:cf:11:d2',
      internal: false,
      cidr: '10.85.117.60/22',
    },
  ],
  utun2: [
    {
      address: '10.100.100.100',
      netmask: '255.255.224.0',
      family: 'IPv4',
      mac: '00:00:00:00:00:00',
      internal: false,
      cidr: '10.255.182.172/19',
    },
  ],
};

const mockEntrypoints = [
  {
    entryName: 'main',
    entry: '/example/node_modules/.modern-js/main/index.js',
    isAutoMount: true,
  },
];

const mockServerRoute = {
  urlPath: '/',
  entryName: 'main',
  entryPath: 'html/main/index.html',
  isSPA: true,
  isSSR: false,
};

rstest.mock('os', () => {
  const originalModule = rstest.requireActual('os');
  return {
    __esModule: true,
    ...originalModule,
    default: {
      networkInterfaces() {
        return mockNetworkInterfaces;
      },
    },
  };
});

rstest.mock('../compiled/chalk', () => {
  return {
    default: {
      blue: rstest.fn(str => str),
      bold: rstest.fn(str => str),
      green: rstest.fn(str => str),
      red: rstest.fn(str => str),
      yellow: rstest.fn(str => str),
      cyanBright: rstest.fn(str => str),
    },
    blue: rstest.fn(str => str),
    bold: rstest.fn(str => str),
    green: rstest.fn(str => str),
    red: rstest.fn(str => str),
    yellow: rstest.fn(str => str),
    cyanBright: rstest.fn(str => str),
  };
});

describe('prettyInstructions', () => {
  test('basic usage', () => {
    const mockAppContext = {
      entrypoints: mockEntrypoints,
      serverRoutes: [
        mockServerRoute,
        {
          urlPath: '/api',
          isApi: true,
          entryPath: '',
          isSPA: false,
          isSSR: false,
        },
      ],
      port: 8080,
      apiOnly: false,
    };

    const message = prettyInstructions(mockAppContext, {});

    expect(message).toMatchSnapshot();
  });

  test('should print https URLs', () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const mockAppContext = {
      entrypoints: mockEntrypoints,
      serverRoutes: [mockServerRoute],
      port: 8080,
      apiOnly: false,
    };

    const message = prettyInstructions(mockAppContext, {
      dev: {
        https: true,
      },
    });

    expect(message).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  test('should print host correctly', () => {
    process.env.NODE_ENV = 'development';

    const mockAppContext = {
      entrypoints: mockEntrypoints,
      serverRoutes: [mockServerRoute],
      port: 8080,
      apiOnly: false,
    };

    const message = prettyInstructions(mockAppContext, {
      dev: {
        host: 'my-host',
      },
    });

    expect(message).toMatchSnapshot();
  });

  test('The src directory does not exist', () => {
    const mockAppContext = {
      entrypoints: [],
      serverRoutes: [
        {
          urlPath: '/api',
          isApi: true,
          entryPath: '',
          isSPA: false,
          isSSR: false,
        },
      ],
      port: 8080,
      apiOnly: true,
    };

    const message = prettyInstructions(mockAppContext, {});

    expect(message).toMatchSnapshot();
  });

  test('custom entry', () => {
    const mockAppContext = {
      entrypoints: [],
      serverRoutes: [],
      port: 8080,
      apiOnly: false,
    };

    const message = prettyInstructions(mockAppContext, {});
    expect(message).toMatchSnapshot();
  });
});
