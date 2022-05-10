import { exec } from 'child_process';

import { OFFICIAL_OWNER } from './constants';

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
