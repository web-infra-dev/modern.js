import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { ApiRouter, APIHandlerInfo } from '@modern-js/bff-core';
import { bff_info_key } from './constant';
import mockAPI from './mockAPI';
import { createApp, closeServer } from './app';

let uped = false;

const BEFORE_ALL_TIMEOUT = 30000;

const setup = () => {
  if (uped) {
    return;
  }

  uped = true;
  const bff_info = (global as any)[bff_info_key];
  const prefix = bff_info?.modernUserConfig?.bff?.prefix;
  const apiRouter = new ApiRouter({
    apiDir: path.join(bff_info.appDir, './api'),
    prefix,
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

  let app:
    | ((
        req: IncomingMessage,
        res: ServerResponse,
        next?: (() => void) | undefined,
      ) => void)
    | null = null;

  beforeAll(async () => {
    if (!app) {
      app = await createApp(
        bff_info.appDir,
        bff_info.modernUserConfig,
        bff_info.plugins,
        bff_info.routes,
      );
    }
  }, BEFORE_ALL_TIMEOUT);

  afterAll(async () => {
    await closeServer();
  });

  mockAPI(apiInfosByFile);
};

setup();
