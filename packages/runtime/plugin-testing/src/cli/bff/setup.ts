import path from 'path';
import { ApiRouter, APIHandlerInfo } from '@modern-js/bff-core';
import { bff_info_key } from './constant';
import mockAPI from './mockAPI';

let uped = false;

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

  mockAPI(apiInfosByFile, (global as any).app);
};

setup();
