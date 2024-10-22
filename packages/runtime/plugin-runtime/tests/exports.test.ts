/**
 * basic test of imported packages
 */
import * as PluginRuntime from '../src';
import * as ssr from '../src/core/server/index';
import head from '../src/exports/head';
import loadable from '../src/exports/loadable';
import * as bff from '../src/exports/server';
import * as styled from '../src/exports/styled';
import * as router from '../src/router';
import * as model from '../src/state';

describe('imported packages in plugin runtime', () => {
  it('plugin-runtime', () => {
    expect(PluginRuntime).toBeDefined();
  });

  it('Helmet', () => {
    expect(head).toBeDefined();
  });

  it('@loadable/component', () => {
    expect(loadable).toBeDefined();
  });

  it('model', () => {
    expect(model).toBeDefined();
  });

  it('router', () => {
    expect(router).toBeDefined();
  });

  it('server', () => {
    expect(bff).toBeDefined();
  });

  it('ssr', () => {
    expect(ssr).toBeDefined();
  });

  it('styled', () => {
    expect(styled).toBeDefined();
  });
});
