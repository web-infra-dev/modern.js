import { Signale, SignaleOptions } from '@modern-js/utils';

export const initTimeLog = (option: SignaleOptions = {}) =>
  new Signale({ interactive: true, scope: 'time-log', ...option });

export const startTime = (signaleInstance: Signale, prefix = '') => {
  signaleInstance.time(prefix);
};

export const endTime = (signaleInstance: Signale, prefix = '') => {
  signaleInstance.timeEnd(prefix);
};
