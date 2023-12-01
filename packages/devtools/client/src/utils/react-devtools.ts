import type { Wall } from 'react-devtools-inline';

export interface ReactDevtoolsWallEvent {
  event: string;
  payload: any;
  transferable?: any[] | undefined;
}

export type ReactDevtoolsWallListener = (event: ReactDevtoolsWallEvent) => void;

export class ReactDevtoolsWallAgent implements Wall {
  listeners: ReactDevtoolsWallListener[] = [];

  sender?: (event: ReactDevtoolsWallEvent) => void;

  send(event: string, payload: any, transferable?: any[] | undefined): void {
    this.sender?.({
      event,
      payload,
      transferable,
    });
  }

  listen(fn: ReactDevtoolsWallListener): ReactDevtoolsWallListener {
    this.listeners.includes(fn) || this.listeners.push(fn);
    return fn;
  }

  emit(event: ReactDevtoolsWallEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
