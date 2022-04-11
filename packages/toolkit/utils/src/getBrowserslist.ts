import { browserslist } from './compiled';

export const defaults = ['> 0.01%', 'not dead', 'not op_mini all'];

export const getBrowserslist = (appDirectory: string) =>
  browserslist.loadConfig({ path: appDirectory }) || defaults;
