import { Hookable } from 'hookable';
import { Wall, AnyFn } from 'react-devtools-inline';

export interface ReactDevtoolsWallEvent {
  event: string;
  payload: any;
  transferable?: any[] | undefined;
}

export type ReactDevtoolsWallListener = (event: ReactDevtoolsWallEvent) => void;

export type WallAgentHooks = Record<
  'send' | 'receive',
  (event: ReactDevtoolsWallEvent) => void
>;

export class WallAgent extends Hookable<WallAgentHooks> implements Wall {
  listen(fn: AnyFn): AnyFn {
    this.hook('receive', fn);
    return fn;
  }

  send(event: string, payload: any, transferable?: any[] | undefined): void {
    const e = {
      event,
      payload,
      transferable,
    };
    this.callHook('send', e);
  }
}
