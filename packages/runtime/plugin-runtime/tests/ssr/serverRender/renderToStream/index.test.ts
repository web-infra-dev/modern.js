/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import App from '../../fixtures/streaming-ssr/App';
import ShellError from '../../fixtures/streaming-ssr/ShellError';
import { render } from '../../../../src/ssr/serverRender/renderToStream';
import { createSSRTracker } from '../../../../src/ssr/serverRender/tracker';

const emitCounter = jest.fn();
const errorLogger = jest.fn();
const reportError = jest.fn();

const ssrServerContext = {
  logger: {
    ...console,
    error: errorLogger,
  },
  request: new Request('http://127.0.0.1'),
  reporter: {
    reportError,
    reportTiming() {
      // no Impl
    },
  },
  serverTiming: {
    addServeTiming() {
      // no impl
    },
  },
};

const context: any = {
  ssrContext: {
    request: {
      headers: {},
    },
    template: fs
      .readFileSync(
        path.resolve(__dirname, '../../fixtures/streaming-ssr/template.html'),
      )
      .toString(),
    tracker: createSSRTracker(ssrServerContext as any),
    redirection: {},
  },
  loaderManager: {
    hasPendingLoaders: jest.fn(),
  },
};
const config: any = {};

let mockStream: Transform;
let htmlForStream = '';

beforeEach(() => {
  mockStream = new Transform({
    autoDestroy: true,
    write(chunk: any, _: any, callback: any) {
      htmlForStream += chunk.toString();
      this.push(chunk);
      callback();
    },
  });
});

afterEach(() => {
  emitCounter.mockClear();
  errorLogger.mockClear();
});

describe('renderToStream', () => {
  test('basic usage', async () => {
    const pipe = await render({ App, context, config });

    await new Promise(resolve => {
      mockStream.on('close', () => {
        resolve(1);
      });
      // 'close' event is not triggered (don't know why), so use 'finish' event instead.
      mockStream.on('finish', () => {
        resolve(1);
      });
      pipe(mockStream);
    });

    // FIXME: windows snapshot has no title tag
    // expect(htmlForStream).toMatchSnapshot();
    expect(htmlForStream).toMatch(
      /<div>App Layout<\/div>[\s\S]*<div>loading home...<\/div>/,
    );
    expect(errorLogger).toHaveBeenCalledTimes(0);
  });

  test('fallback when error throws during shell rendering', async () => {
    const pipe = await render({ App: ShellError, context, config });

    await new Promise(resolve => {
      pipe(mockStream).then(data => {
        htmlForStream = data as string;
        resolve(data);
      });
    });

    // FIXME: windows snapshot has no title tag
    // expect(htmlForStream).toMatchSnapshot();
    expect(htmlForStream).toMatch(/<div id="root"><\/div>/);
    expect(htmlForStream).toMatch(/"renderLevel":0/);
    expect(errorLogger).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledTimes(1);
  });
});
