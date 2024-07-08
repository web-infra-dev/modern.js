import { ServerTiming as ServerTimingInterafce } from '@modern-js/types';

export class ServerTiming implements ServerTimingInterafce {
  private headerList: string[] = [];

  private meta: string;

  constructor(meta: string) {
    this.meta = meta;
  }

  get headers(): string[] {
    return this.headerList;
  }

  addServeTiming(name: string, dur: number, desc?: string) {
    // TODO: Modern.js should't export anything about bytedance.
    const _name = `bd-${this.meta}-${name}`;

    const value = `${_name};${desc ? `decs="${desc}";` : ''} dur=${dur}`;

    this.headerList.push(value);

    return this;
  }
}
