import app, { EntryOptions } from './template/app';

export const entry = (config: EntryOptions) => app(config);

export const spec = ({
  serviceName = 'modernjs-app',
  funcName = 'modernjs-func',
  region = 'ap-guangzhou',
} = {}) => {
  const base = {
    app: serviceName,
    component: 'scf',
    name: 'scf-nodejs',
  };

  const events = [
    {
      apigw: {
        protocols: ['http', 'https'],
        environment: 'release',
        parameters: { endpoints: [{ path: '/', method: 'GET' }] },
      },
    },
  ];

  const inputs = {
    src: './',
    type: 'web',
    name: funcName,
    region,
    runtime: 'Nodejs12.16',
    memorySize: 128,
    timeout: 3,
    events,
  };

  return {
    ...base,
    inputs,
  };
};
