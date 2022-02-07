import * as path from 'path';
import { logger, fs } from '@modern-js/utils';
import glob from 'glob';

const validEditorDirectory = (
  appDirectory: string,
  internalDirectory: string,
) => {
  const editorDir = path.resolve(appDirectory, 'src/__editor__');
  const autoEditorDir = path.resolve(internalDirectory, `__editor__`);
  return fs.existsSync(editorDir) || fs.existsSync(autoEditorDir);
};

const validEditorResource = (
  appDirectory: string,
  internalDirectory: string,
) => {
  const userEditorFiles = glob.sync(
    `${appDirectory}/src/__editor__/**/*.@(js|jsx|ts|tsx)`,
  );
  const autoEditorFiles = glob.sync(
    `${internalDirectory}/__editor__/**/*.@(js|jsx|ts|tsx)`,
  );
  return userEditorFiles.length > 0 || autoEditorFiles.length > 0;
};

// 方法未用到？ @gaobowen
export const validEditor = (
  appDirectory: string,
  internalDirectory: string,
  notExit = false,
) => {
  const projectName = path.basename(appDirectory);
  if (!validEditorDirectory(appDirectory, internalDirectory)) {
    const logText = `没有检测到 '${projectName}/src/__editor__' 目录, 请提供__editor__目录以及nocode文件`;
    if (!notExit) {
      logger.error(logText);
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    }

    logger.warn(logText);
    return;
  }

  if (!validEditorResource(appDirectory, internalDirectory)) {
    const logText = `没有检测到 nocode 文件`;

    if (!notExit) {
      logger.error(logText);
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    }

    logger.warn(logText);
  }
};

const _state = {
  server: null,
  sockets: [],
  reloadReturned: null,
};

export const setReloadReturned = (value: any) => {
  _state.reloadReturned = value;
};
export const getReloadReturned = () => _state.reloadReturned;

export const loadTemplate = async (file: string, customPath = false) => {
  const _ = require('lodash');
  let template = '';
  if (customPath) {
    template = await fs.readFile(file, 'utf-8');
  } else {
    template = await fs.readFile(
      path.resolve(__dirname, '../styles/template/', file),
      'utf-8',
    );
  }

  return _.template(template, {
    interpolate: /<%=([\s\S]+?)%>/g,
  });
};
