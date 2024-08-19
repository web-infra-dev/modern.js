import type { BirpcReturn } from 'birpc';
import { Hookable } from 'hookable';
import type { Wall, AnyFn } from 'react-devtools-inline';

export interface ReactDevtoolsWallEvent {
  event: string;
  payload: any;
  transferable?: any[] | undefined;
}

export type ReactDevtoolsWallListener = (
  event: ReactDevtoolsWallEvent,
  ...rest: unknown[]
) => void;

export interface WallAgentHooks {
  send: ReactDevtoolsWallListener;
  receive: ReactDevtoolsWallListener;
  open: () => void;
  close: () => void;
  active: () => void;
}

export type BirpcReturnLike = Record<string, (...args: any[]) => void> & {
  $functions: Record<string, (...args: any[]) => void>;
};

export type WallAgentStatus = 'open' | 'close' | 'active';

export class WallAgent extends Hookable<WallAgentHooks> implements Wall {
  status: WallAgentStatus = 'close';

  constructor() {
    super();
    const intendChangeStatus = (status: WallAgentStatus) => {
      if (this.status === status) return;
      this.status = status;
      this.callHook(status);
    };
    this.hook('send', e => {
      if (e.event === 'shutdown') {
        intendChangeStatus('close');
      }
    });
    this.hook('receive', e => {
      if (e.event === 'shutdown') {
        intendChangeStatus('close');
      } else if (e.event === 'operations') {
        intendChangeStatus('active');
      } else {
        intendChangeStatus('open');
      }
    });
  }

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

  bindRemote(remote: BirpcReturn<object, object>, methodName: string) {
    const _remote = remote as any;

    const handler = (event: ReactDevtoolsWallEvent, ...rest: unknown[]) => {
      this.callHook('receive', event, ...rest);
    };
    _remote.$functions[methodName] = handler;

    const listener: ReactDevtoolsWallListener = (event, ...rest) => {
      _remote[methodName](event, ...rest);
    };
    this.hook('send', listener);

    const unreg = () => {
      if (_remote.$functions[methodName] === handler) {
        delete _remote.$functions[methodName];
      }
      this.removeHook('send', listener);
    };
    return unreg;
  }
}
