import app, { EntryOptions } from './template/app';

export const entry = (config: EntryOptions) => app(config);

export const spec = ({
  serviceName = 'modernjs-service',
  funcName = 'modernjs-func',
} = {}) => {
  const base = {
    ROSTemplateFormatVersion: '2015-09-01',
    Transform: 'Aliyun::Serverless-2018-04-03',
  };

  const events = {
    'http-events': {
      Type: 'HTTP',
      Properties: {
        AuthType: 'ANONYMOUS',
        Methods: ['GET', 'POST'],
      },
    },
  };

  const domain = {
    Type: 'Aliyun::Serverless::CustomDomain',
    Properties: {
      DomainName: 'Auto',
      Protocol: 'HTTP',
      RouteConfig: {
        Routes: {
          '/*': {
            ServiceName: serviceName,
            FunctionName: funcName,
          },
        },
      },
    },
  };

  const service = {
    [serviceName]: {
      Type: 'Aliyun::Serverless::Service',
      Properties: {
        Description: 'modern.js service',
      },
      [funcName]: {
        Type: 'Aliyun::Serverless::Function',
        Properties: {
          Handler: 'index.handler',
          CodeUri: './',
          Initializer: 'index.Initializer',
          Description: 'modern.js app',
          Runtime: 'nodejs12',
        },
        Events: events,
      },
    },
  };

  return {
    ...base,
    Resources: {
      ...service,
      Domain: domain,
    },
  };
};
