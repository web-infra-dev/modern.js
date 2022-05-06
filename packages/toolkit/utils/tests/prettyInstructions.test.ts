import { prettyInstructions } from '../src/prettyInstructions';

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

jest.mock('os', () => {
  const originalModule = jest.requireActual('os');
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

jest.mock('../compiled/chalk', () => {
  return {
    blue: jest.fn(str => str),
    bold: jest.fn(str => str),
    green: jest.fn(str => str),
    red: jest.fn(str => str),
    yellow: jest.fn(str => str),
    cyanBright: jest.fn(str => str),
  };
});

describe('prettyInstructions', () => {
  test('basic usage', () => {
    const mockAppContext = {
      entrypoints: [
        {
          entryName: 'main',
          entry: '/example/node_modules/.modern-js/main/index.js',
          isAutoMount: true,
          customBootstrap: false,
        },
      ],
      serverRoutes: [
        {
          urlPath: '/',
          entryName: 'main',
          entryPath: 'html/main/index.html',
          isSPA: true,
          isSSR: false,
          enableModernMode: false,
        },
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
    const mockConfig = {
      dev: {
        https: true,
      },
    };

    const message = prettyInstructions(mockAppContext, mockConfig);

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

    const mockConfig = {
      dev: {
        https: true,
      },
    };

    const message = prettyInstructions(mockAppContext, mockConfig);

    expect(message).toMatchSnapshot();
  });
});
