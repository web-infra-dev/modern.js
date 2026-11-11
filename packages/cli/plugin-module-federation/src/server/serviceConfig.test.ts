import { expect, it } from '@rstest/core';
import { getServiceConfig, registerServiceConfig } from './serviceConfig';
import serviceRuntimePlugin from './serviceRuntimePlugin';

it('keeps private deployment bindings scoped to server runtime identity', () => {
  const first = {
    'weather/App': {
      serviceHeaders: { authorization: 'first-secret' },
    },
  };
  const second = { 'weather/App': { timeoutMs: 1234 } };
  registerServiceConfig('private-first', first);
  registerServiceConfig('private-second', second);
  expect(getServiceConfig('private-first')).toBe(first);
  expect(getServiceConfig('private-second')).toBe(second);
  expect(serviceRuntimePlugin({ name: 'private-first' }).name).toBe(
    'bridge-service',
  );
  expect(() =>
    serviceRuntimePlugin({ name: 'unregistered-private-runtime' }),
  ).toThrow('no server configuration');
  expect(serviceRuntimePlugin({}).name).toBe('bridge-service');
});
