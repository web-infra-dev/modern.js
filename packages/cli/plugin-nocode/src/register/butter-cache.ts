import { exec } from 'child_process';
import * as path from 'path';
import { fs } from '@modern-js/utils';
import axios from './axios';

import {
  DEP_HOST,
  UPLOAD_URL,
  BUILT_IN_LIST,
  WHITE_LIST,
  OFFICIAL_OWNER,
} from './constants';

const DEP_URL = deps =>
  `${DEP_HOST}/api/dependency/packages/${encodeURIComponent(
    Object.keys(deps)
      .reduce((query, dep) => `${query}+${dep}@${deps[dep]}`, '')
      .substr(1),
  )}`;

const execPromise = command =>
  new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1000 }, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(res);
    });
  });

const mergeDependencies = deps => {
  const depNames = Object.keys(deps);
  const filterDepNames = depNames.filter(name => !WHITE_LIST.includes(name));

  return {
    ...filterDepNames.reduce(
      (ret, name) => ({ ...ret, [name]: deps[name] }),
      {},
    ),
    ...BUILT_IN_LIST,
  };
};

/**
 * 为项目添加官方owner
 *
 * @param {string} absoluteDir - 项目地址
 */

export const addOfficialOwner = async absoluteDir => {
  try {
    await execPromise(`cd ${absoluteDir} && npm owner add ${OFFICIAL_OWNER}`);
  } catch (err) {}
};

export const createDependencyCache = async absoluteDir => {
  try {
    const { devDependencies = {}, dependencies = {} } = require(path.resolve(
      absoluteDir,
      './package.json',
    ));
    const deps = mergeDependencies({ ...devDependencies, ...dependencies });

    const depUrl = DEP_URL(deps);

    // 错误机制在axios内部实现（代码实现 by: zhengfankai, 注释 by: gaobowen
    await axios(depUrl);
  } catch (err) {}
};

export const uploadUmdToTos = async absoluteDir => {
  try {
    const umdPath = path.resolve(absoluteDir, 'dist/umd/index.js');
    // TODO: 待确认，这里的逻辑可能可以移除
    const storyUmdPath = path.resolve(absoluteDir, 'dist/umd/stories/index.js');
    const { name, version } = require(path.resolve(
      absoluteDir,
      './package.json',
    ));

    const tasks = [];
    const existUmdPath = fs.existsSync(umdPath);
    const existStoryUmdPath = fs.existsSync(storyUmdPath);

    if (existUmdPath) {
      tasks.push(
        axios({
          method: 'POST',
          url: UPLOAD_URL,
          data: {
            content: await fs.readFile(umdPath),
            path: `butter/block/${name}/${version}/mod.js`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }),
      );
    }
    if (existStoryUmdPath) {
      tasks.push(
        axios({
          method: 'POST',
          url: UPLOAD_URL,
          data: {
            content: await fs.readFile(storyUmdPath),
            path: `butter/stories/${name}/${version}/mod.js`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }),
      );
    }

    await Promise.all(tasks);
  } catch (err) {}
};
