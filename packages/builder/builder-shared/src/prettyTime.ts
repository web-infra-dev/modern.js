import basePrettyTime from '../compiled/pretty-time';
import chalk from '@modern-js/utils/chalk';

const TIME_REGEXP = /(\d+)([a-zA-Z]+)/;

export const prettyTime = (time: number | [number, number], digits: number) => {
  const timeStr: string = basePrettyTime(time, digits);

  return timeStr.replace(TIME_REGEXP, (match, p1, p2) => {
    if (p1 && p2) {
      return `${chalk.bold(p1)} ${p2}`;
    }
    return chalk.bold(match);
  });
};
