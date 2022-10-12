import webpack from 'webpack';
import { bus } from './helpers/bus';
import type { Props } from './helpers/type';

export interface ProgressOptions
  extends Omit<Partial<Props>, 'message' | 'total' | 'current' | 'done'> {
  id?: string;
  quiet?: boolean;
  quietOnDev?: boolean;
  clearOnDone?: boolean;
}

export class ProgressPlugin extends webpack.ProgressPlugin {
  readonly name: string = 'ProgressPlugin';

  constructor(options: ProgressOptions) {
    const {
      id = 'Modern',
      quiet = false,
      quietOnDev = false,
      clearOnDone = false,
    } = options;
    const isQuite =
      quiet || (quietOnDev && process.env.NODE_ENV === 'development');

    super({
      activeModules: false,
      entries: true,
      modules: true,
      modulesCount: 5000,
      profile: false,
      dependencies: true,
      dependenciesCount: 10000,
      percentBy: null,
      handler(percentage, message) {
        if (!isQuite && process.stdout.isTTY) {
          const done = percentage === 1;
          bus.update({
            id,
            current: percentage * 100,
            message,
            done,
          });
          bus.render();
          if (percentage === 1 && clearOnDone) {
            bus.clear();
          }
        }
      },
    });
  }
}
