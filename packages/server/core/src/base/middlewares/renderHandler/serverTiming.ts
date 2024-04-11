import { ServerTiming as ServerTimingInterafce } from '@modern-js/types';

const SERVER_TIMING = 'Server-Timing';

export class ServerTiming implements ServerTimingInterafce {
  private headers: Headers;

  private meta: string;

  constructor(headers: Headers, meta: string) {
    this.meta = meta;
    this.headers = headers;
  }

  addServeTiming(name: string, dur: number, desc?: string) {
    // TODO: Modern.js should't export anything about bytedance.
    const _name = `bd-${this.meta}-${name}`;

    const value = `${_name};${desc ? `decs="${desc}";` : ''} dur=${dur}`;

    this.headers.append(SERVER_TIMING, value);
    return this;
  }
}
