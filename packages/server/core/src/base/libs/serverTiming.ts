import { ServerTiming as ServerTimingInterafce } from '@modern-js/types';
import { HonoContext } from '../types';

const SERVER_TIMING = 'Server-Timing';

export class ServerTiming implements ServerTimingInterafce {
  c: HonoContext;

  meta: string;

  constructor(c: HonoContext, meta: string) {
    this.meta = meta;
    this.c = c;
  }

  addServeTiming(name: string, dur: number, desc?: string) {
    // TODO: Modern.js should't export anything about bytedance.
    const _name = `bd-${this.meta}-${name}`;

    const value = `${_name};${desc ? `decs="${desc}";` : ''} dur=${dur}`;

    this.c.header(SERVER_TIMING, value);
    return this;
  }
}
