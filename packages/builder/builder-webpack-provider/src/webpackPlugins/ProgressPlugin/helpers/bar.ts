import cliTruncate from '../../../../compiled/cli-truncate';
import type { Props } from './type';
import { clamp } from './utils';
import chalk from '@modern-js/utils/chalk';

const defaultOption: Props = {
  total: 100,
  current: 0,
  color: 'green',
  bgColor: 'gray',
  char: '━',
  width: 25,
  buildIcon: '◯',
  message: '',
  done: false,
  spaceWidth: 1,
  messageWidth: 25,
  messageColor: 'grey',
  id: '',
  maxIdLen: 16,
  hasErrors: false,
};

const padding = (id: string, maxLen: number) => {
  const left = Math.floor((maxLen - id.length) / 2);
  const right = maxLen - left - id.length;
  return ' '.repeat(left) + id + ' '.repeat(right);
};

export const FULL_WIDTH = 70; // display all info
export const MIDDLE_WIDTH = 40; // remove message info
export const SMALL_WIDTH = 15; // remove bar and message info

export const renderBar = (option: Partial<Props>) => {
  const mergedOptions = {
    ...defaultOption,
    ...option,
  };
  const {
    total,
    done,
    buildIcon,
    width,
    current,
    color,
    bgColor,
    char,
    message,
    messageWidth,
    spaceWidth,
    messageColor,
    maxIdLen,
    hasErrors,
  } = mergedOptions;

  const space = ' '.repeat(spaceWidth);
  const percent = clamp(Math.floor((current / total) * 100), 0, 100);

  // colors
  const barColor = Reflect.get(chalk, color);
  const backgroundColor = Reflect.get(chalk, bgColor);
  const doneColor = hasErrors ? chalk.bold.red : Reflect.get(chalk, color);
  const idColor = done ? doneColor : barColor;

  const id = mergedOptions.id
    ? idColor(padding(mergedOptions.id, maxIdLen))
    : '';
  const { columns: terminalWidth = FULL_WIDTH } = process.stdout;

  if (done) {
    return '';
  }

  const msgStr = Reflect.get(
    chalk,
    messageColor,
  )(cliTruncate(message, messageWidth, { position: 'start' }));

  const left = clamp(Math.floor((percent * width) / 100), 0, width);
  const right = clamp(width - left, 0, width);
  const barStr = `${barColor(char.repeat(left))}${backgroundColor(
    char.repeat(right),
  )}`;
  const percentStr = `${percent.toString().padStart(3)}%`;

  if (terminalWidth >= FULL_WIDTH) {
    return [
      idColor(buildIcon),
      id,
      space,
      barStr,
      space,
      percentStr,
      space,
      msgStr,
    ].join('');
  }

  if (terminalWidth >= MIDDLE_WIDTH) {
    return [idColor(buildIcon), id, space, barStr, space, percentStr].join('');
  }

  return [idColor(buildIcon), id, space, percentStr].join('');
};
