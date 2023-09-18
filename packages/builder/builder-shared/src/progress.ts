import type { ForegroundColor as Color } from '@modern-js/utils/compiled/chalk';

const colorList: Array<typeof Color> = [
  'green',
  'cyan',
  'yellow',
  'blue',
  'greenBright',
  'cyanBright',
  'yellowBright',
  'blueBright',
  'redBright',
  'magentaBright',
];

export const getProgressColor = (index: number) =>
  colorList[index % colorList.length];
