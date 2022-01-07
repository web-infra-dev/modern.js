import { bff_info_key } from './constant';
import mockAPI from './mockAPI';
import { getAllAPIInfos } from './utils';

let uped = false;

const setup = () => {
  if (uped) {
    return;
  }

  uped = true;

  const bff_info = (global as any)[bff_info_key];
  const prefix = bff_info?.modernUserConfig?.bff?.prefix;
  const apiInfos = getAllAPIInfos(bff_info.appDir, prefix);

  const apiInfosByFile = apiInfos.reduce<
    Record<string, ReturnType<typeof getAllAPIInfos>>
  >((res, apiInfo) => {
    if (!res[apiInfo.apiFile]) {
      res[apiInfo.apiFile] = [];
    }
    res[apiInfo.apiFile].push(apiInfo);

    return res;
  }, {});

  mockAPI(apiInfosByFile, (global as any).app);
};

setup();
