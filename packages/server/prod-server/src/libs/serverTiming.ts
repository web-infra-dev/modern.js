import { ServerTiming as IServerTiming } from '@modern-js/types';

interface Res {
  getHeader: (name: string) => number | string | string[] | undefined;
  setHeader: (name: string, value: string) => void;
}

const SERVER_TIMING = 'Server-Timing';

export class ServerTiming implements IServerTiming {
  meta: string;

  res: Res;

  constructor(res: Res, meta: string) {
    this.meta = meta;
    this.res = res;
  }

  addServeTiming(name: string, dur: number, desc?: string) {
    const _name = `bd-${this.meta}-${name}`;
    const serverTiming =
      this.res.getHeader(SERVER_TIMING) ||
      this.res.getHeader(SERVER_TIMING.toLocaleLowerCase());
    const value = `${_name};${desc ? `decs="${desc}";` : ''} dur=${dur}`;

    this.res.setHeader(
      SERVER_TIMING,
      serverTiming ? `${serverTiming}, ${value}` : value,
    );

    return this;
  }
}
