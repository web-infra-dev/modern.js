import { loadConfig } from 'browserslist/node';

export const defaults = ['> 0.01%', 'not dead', 'not op_mini all'];

export const getBrowserslist = (appDirectory: string) =>
  loadConfig({ path: appDirectory }) || defaults;
