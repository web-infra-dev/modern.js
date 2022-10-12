import cliTruncate from 'cli-truncate';
import type { Props } from './type';
import { clamp } from './utils';
import chalk from '@modern-js/utils/chalk';

const defaultOption: Props = {
  total: 100,
  current: 0,
  color: 'green',
  bgColor: 'gray',
  char: '█',
  width: 25,
  buildIcon: '◯',
  finishIcon: '✔',
  finishInfo: 'finished',
  message: '',
  done: false,
  spaceWidth: 1,
  messageWidth: 25,
  messageColor: 'grey',
  id: '',
  maxIdLen: 16,
};
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const padding = (id: string, maxLen: number) => {
  const left = Math.floor((maxLen - id.length) / 2);
  const right = maxLen - left - id.length;
  return ' '.repeat(left) + id + ' '.repeat(right);
};

export const FULL_WIDTH = 70; // 全部显示
export const MIDDLE_WIDTH = 40; // 去除文件信息
export const SMALL_WIDTH = 15; // 去除进度条+去除文件信息

export const renderBar = (option: Partial<Props>) => {
  const {
    total,
    done,
    finishIcon,
    buildIcon,
    finishInfo,
    width,
    current,
    color,
    bgColor,
    char,
    message,
    messageWidth,
    spaceWidth,
    messageColor,
    id,
    maxIdLen,
  } = {
    ...defaultOption,
    ...option,
  };
  const space = ' '.repeat(spaceWidth);
  const percent = clamp(
    total <= 0 ? 0 : Math.floor((current / total) * 100),
    0,
    100,
  );
  const fc = Reflect.get(chalk, color);
  const bc = Reflect.get(chalk, bgColor);
  const idStr = id ? fc(padding(id, maxIdLen)) : '';
  const { columns = FULL_WIDTH } = process.stdout;

  if (done) {
    if (columns >= MIDDLE_WIDTH) {
      return [idStr, fc(`${finishIcon}${space}${finishInfo}`)].join('');
    }
    return [idStr, fc(`${finishIcon}`)].join('');
  }
  const msgStr = Reflect.get(
    chalk,
    messageColor,
  )(cliTruncate(message, messageWidth, { position: 'start' }));
  const frameStr = fc(frames[current % frames.length]);
  if (total <= 0) {
    // 无法获取百分比时用动画表示进度
    if (columns >= MIDDLE_WIDTH) {
      return [idStr, frameStr, space, msgStr].join('');
    }
    return [idStr, frameStr].join('');
  }
  const left = clamp(Math.floor((percent * width) / 100), 0, width);
  const right = clamp(width - left, 0, width);
  const barStr = `${fc(char.repeat(left))}${bc(char.repeat(right))}`;
  const percentStr = `${percent.toString().padStart(3)}%`;
  if (columns >= FULL_WIDTH) {
    return [
      idStr,
      fc(buildIcon),
      space,
      barStr,
      space,
      percentStr,
      space,
      msgStr,
    ].join('');
  }
  if (columns >= MIDDLE_WIDTH) {
    return [idStr, fc(buildIcon), space, barStr, space, percentStr].join('');
  }
  if (columns >= SMALL_WIDTH) {
    return [idStr, fc(buildIcon), space, percentStr].join('');
  }
  return [idStr, fc(buildIcon), space, frameStr].join('');
};
