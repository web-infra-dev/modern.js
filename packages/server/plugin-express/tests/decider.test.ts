import path from 'path';
import request from 'supertest';
import plugin from '../src/plugin';
import { APIPlugin, createPluginManager } from './helpers';

const pwd = path.join(__dirname, './fixtures/lambda-mode');

describe('support input params decider', () => {
  const message = 'hello';
  const name = 'modern-js';
  const prefix = '/api';
  let apiHandler: any;

  beforeAll(async () => {
    const pluginManager = createPluginManager();

    pluginManager.addPlugins([APIPlugin, plugin()]);

    const runner = await pluginManager.init();

    apiHandler = await runner.prepareApiServer({
      pwd,
      prefix,
      httpMethodDecider: 'inputParams',
    });
  });

  test('should support get', async () => {
    const res = await request(apiHandler).get(`${prefix}/input/getMessage`);
    expect(res.status).toBe(200);
    expect(res.text).toEqual(message);
  });

  test('should support post', async () => {
    const res = await request(apiHandler)
      .post(`${prefix}/input/postMessage`)
      .send({
        args: [message, name],
      });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message, name, method: 'POST' });
  });
});
