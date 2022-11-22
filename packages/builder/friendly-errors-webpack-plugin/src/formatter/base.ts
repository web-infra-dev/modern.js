import util from 'util';
import { ErrorFormatter } from '../shared/types';

export const baseFormatter: ErrorFormatter = e => {
  return util.inspect(e.raw);
};
