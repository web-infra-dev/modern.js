import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { ApiRouter, APIHandlerInfo } from '@modern-js/bff-core';
import { bff_info_key } from './constant';
import mockAPI from './mockAPI';
import { createApp, closeServer } from './app';

let uped = false;

const setup = () => {
  if (uped) {
    return;
  }

  uped = true;
  const bff_info = (global as any)[bff_info_key];
  const prefix = bff_info?.modernUserConfig?.bff?.prefix;
  const httpMethodDecider = bff_info?.modernUserConfig?.bff?.httpMethodDecider;

  let app:
    | ((
        req: IncomingMessage,
        res: ServerResponse,
        next?: (() => void) | undefined,
      ) => void)
    | null = null;

  beforeAll(async () => {
    const apiRouter = new ApiRouter({
      appDir: bff_info.appDir,
      apiDir: path.join(bff_info.appDir, './api'),
      prefix,
      httpMethodDecider,
    });
    const apiInfos = apiRouter.getApiHandlers();

    const apiInfosByFile = apiInfos.reduce<Record<string, APIHandlerInfo[]>>(
      (res, apiInfo) => {
        if (!res[apiInfo.filename]) {
          res[apiInfo.filename] = [];
        }
        res[apiInfo.filename].push(apiInfo);

        return res;
      },
      {},
    );

    // The mockAPI function is executed before createApp to ensure that the mock can succeed
    // createApp calls requireActual, so it is not affected by mock
    // The mockAPI function is in the beforeAll hook, so developers can mock bff api (such as useContext), because jest.mock will be executed before this file in the test file
    // The ideal execution sequence is: mock in test case -> mock in this file -> import in test case, so import lambda file should be in the test function
    mockAPI(apiInfosByFile);
    if (!app) {
      app = await createApp(
        bff_info.appDir,
        bff_info.modernUserConfig,
        bff_info.plugins,
        bff_info.routes,
      );
    }
  });

  afterAll(async () => {
    await closeServer();
  });
};

setup();
