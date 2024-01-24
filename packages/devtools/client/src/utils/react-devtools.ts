import { BirpcReturn } from 'birpc';
import { Hookable } from 'hookable';
import { Wall, AnyFn } from 'react-devtools-inline';

export interface ReactDevtoolsWallEvent {
  event: string;
  payload: any;
  transferable?: any[] | undefined;
}

export type ReactDevtoolsWallListener = (
  event: ReactDevtoolsWallEvent,
  ...rest: unknown[]
) => void;

export type WallAgentHooks = Record<
  'send' | 'receive',
  ReactDevtoolsWallListener
>;

export type BirpcReturnLike = Record<string, (...args: any[]) => void> & {
  $functions: Record<string, (...args: any[]) => void>;
};

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

  bindRemote(remote: BirpcReturn<object, object>, methodName: string) {
    const _remote = remote as any;
    _remote.$functions[methodName] = (
      event: ReactDevtoolsWallEvent,
      ...rest: unknown[]
    ) => {
      this.callHook('receive', event, ...rest);
    };
    this.hook('send', (...args) => {
      _remote[methodName](...args);
    });
    return this;
  }
}
