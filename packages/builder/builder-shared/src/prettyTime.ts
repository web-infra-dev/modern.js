import basePrettyTime from '../compiled/pretty-time';
import chalk from '@modern-js/utils/chalk';

const TIME_REGEXP = /([\d.]+)([a-zA-Z]+)/;

export const prettyTime = (time: number | [number, number], digits = 1) => {
  const timeStr: string = basePrettyTime(time, digits);

  return timeStr.replace(TIME_REGEXP, (match, p1, p2) => {
    if (p1 && p2) {
      let time = p1;

      // remove digits of ms time
      if (p2 === 'ms') {
        time = Number(time).toFixed(0);
      }

      return `${chalk.bold(time)} ${p2}`;
    }
    return chalk.bold(match);
  });
};
