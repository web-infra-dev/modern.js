export type AnyFn = (...args: any[]) => any;
export type EventParams<T> = T extends any[] ? T : never;

export interface EventEmitterLike<Events> {
  addListener: <Event extends keyof Events>(
    event: Event,
    listener: (...args: EventParams<Events[Event]>) => void,
  ) => void;
  removeListener: (event: keyof Events, listener: AnyFn) => void;
}

export const once = <Events, Event extends keyof Events>(
  emitter: EventEmitterLike<Events>,
  event: Event,
  filter?: (...args: EventParams<Events[Event]>) => boolean,
) =>
  new Promise(resolve => {
    const handler = (...args: EventParams<Events[Event]>) => {
      if (filter) {
        if (filter(...args)) {
          resolve(args);
          emitter.removeListener(event, handler);
        }
      } else {
        resolve(args);
        emitter.removeListener(event, handler);
      }
    };
    emitter.addListener(event, handler);
  });
