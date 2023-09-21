import basePrettyTime from '../compiled/pretty-time';
import chalk from '@modern-js/utils/chalk';

export const prettyTime = (time: number | [number, number], digits: number) => {
  const timeStr: string = basePrettyTime(time, digits);

  return timeStr.replace(
    /(\d+)([a-zA-Z]+)/,
    (match, p1, p2) => `${chalk.bold(p1)} ${p2}`,
  );
};
