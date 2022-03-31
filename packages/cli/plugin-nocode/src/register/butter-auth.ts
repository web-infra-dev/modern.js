import * as os from 'os';
import * as path from 'path';
import { fs } from '@modern-js/utils';
import { v4 as uuidv4 } from 'uuid';
import opener from 'opener';

import axios from './axios';
import { LARKCLOUD_PATH } from './env';
import loggerModule from './logger';
import {
  SESSION_HEADER,
  LARCK_SSO_AUTH_HEADER,
  LARCK_SSO_AUTH_VERSION,
} from './constants';

const logger = loggerModule.scope('AUTH____');

const CLOSE_ME_URL = 'https://ttt5xh.web.bytedance.net';
const AUTH_WAIT_INTERVAL = 1000;
const AUTH_WAIT_COUNT = 60;
const BUTTER_CONFIG = path.resolve(os.homedir(), '.butter.json');

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t));

const checkLoggedIn = async (token: any) => {
  if (!token) {
    return false;
  }

  const res = await axios.get(`${LARKCLOUD_PATH}/v3/users/isLogin`, {
    headers: {
      [SESSION_HEADER]: token,
    },
  });
  return res.data.isLogin;
};

const checkAuth = async (token: string) => {
  const isLoggedIn = await checkLoggedIn(token);
  if (!isLoggedIn) {
    throw new Error('not logged in yet');
  }
  return token;
};

const waitForAuth: (token: string, time?: number) => Promise<string> = async (
  token: string,
  time = 0,
) => {
  await delay(AUTH_WAIT_INTERVAL);

  if (time >= AUTH_WAIT_COUNT) {
    throw new Error('auth time out');
  }

  try {
    return await checkAuth(token);
  } catch (err) {
    return await waitForAuth(token, time + 1);
  }
};

const getToken = async () => {
  const token = uuidv4();
  const res = await axios.get(`${LARKCLOUD_PATH}/oauth/redirectUrl`, {
    params: {
      platform: 'bytedanceInternal',
      mode: 'redirect',
      redirectURL: CLOSE_ME_URL,
      host: LARKCLOUD_PATH,
    },
    headers: {
      [SESSION_HEADER]: token,
      [LARCK_SSO_AUTH_HEADER]: LARCK_SSO_AUTH_VERSION,
    },
    withCredentials: true,
  });
  const openURL = res.data.redirectUrl;
  logger.info(`open url in browser: ${openURL}`);
  opener(openURL);
  // eslint-disable-next-line @typescript-eslint/return-await
  return await waitForAuth(token);
};

const readLocalConfig = async () => {
  await fs.ensureFile(BUTTER_CONFIG);
  let data;
  try {
    data = await fs.readJSON(BUTTER_CONFIG);
  } catch (err) {
    data = {};
  }
  return data;
};

const writeLocalConfig = async (data: any) =>
  fs.writeJson(BUTTER_CONFIG, data, { spaces: 2 });

const readLocalToken = async () => {
  const data = await readLocalConfig();
  return data.sessionToken;
};

const refreshLocalToken = async () => {
  const newToken = await getToken();

  const data = await readLocalConfig();
  data.sessionToken = newToken;

  await writeLocalConfig(data);

  return newToken;
};

const ensureLogin = async () => {
  logger.info('checking local session token...');

  let token = await readLocalToken();

  const isLoggedIn = await checkLoggedIn(token);
  if (isLoggedIn) {
    logger.info('logged in, continue...');
  } else {
    logger.info('not logged in, logging now...');
    token = await refreshLocalToken();
  }

  return token;
};

export { ensureLogin };
