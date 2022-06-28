/**
 * basic test of imported packages
 */
import * as PluginRuntime from '../src';
import head from '../src/exports/head';
import loadable from '../src/exports/loadable';
import * as model from '../src/exports/model';
import * as request from '../src/exports/request';
import * as router from '../src/exports/router';
import * as bff from '../src/exports/server';
import * as ssr from '../src/exports/ssr';
import * as styled from '../src/exports/styled';

describe('imported packages in plugin runtime', () => {
  it('plugin-runtime', () => {
    expect(PluginRuntime).toMatchSnapshot();
  });

  it('Helmet', () => {
    expect(head).toMatchSnapshot();
  });

  it('@loadable/component', () => {
    expect(loadable).toMatchSnapshot();
  });

  it('model', () => {
    expect(model).toMatchSnapshot();
  });

  it('request', () => {
    expect(request).toMatchSnapshot();
  });

  it('router', () => {
    expect(router).toMatchSnapshot();
  });

  it('server', () => {
    expect(bff).toBeDefined();
  });

  it('ssr', () => {
    expect(ssr).toMatchSnapshot();
  });

  it('styled', () => {
    expect(styled).toMatchSnapshot({
      version: expect.any(String),
    });
  });
});
