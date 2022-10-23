import webpack from 'webpack';
import { bus, createFriendlyPercentage } from './helpers';
import prettyTime from '../../../compiled/pretty-time';
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

  hasErrors: boolean = false;

  compileTime: string | null = null;

  constructor(options: ProgressOptions) {
    const {
      id = 'Modern',
      quiet = false,
      quietOnDev = false,
      clearOnDone = false,
    } = options;
    const isQuite =
      quiet || (quietOnDev && process.env.NODE_ENV === 'development');
    const friendlyPercentage = createFriendlyPercentage();

    super({
      activeModules: false,
      entries: true,
      modules: true,
      modulesCount: 5000,
      profile: false,
      dependencies: true,
      dependenciesCount: 10000,
      percentBy: null,
      handler: (percentage, message) => {
        if (!isQuite && process.stdout.isTTY) {
          // eslint-disable-next-line no-param-reassign
          percentage = friendlyPercentage(percentage);
          const done = percentage === 1;

          bus.update({
            id,
            current: percentage * 100,
            message,
            done,
            hasErrors: this.hasErrors,
            compileTime: this.compileTime,
          });
          bus.render();

          if (percentage === 1 && clearOnDone) {
            bus.clear();
          }
        }
      },
    });
  }

  apply(compiler: webpack.Compiler): void {
    super.apply(compiler);

    let startTime: [number, number] | null = null;

    compiler.hooks.compile.tap(this.name, () => {
      this.compileTime = null;
      startTime = process.hrtime();
    });

    compiler.hooks.done.tap(this.name, stat => {
      if (startTime) {
        this.hasErrors = stat.hasErrors();
        this.compileTime = prettyTime(process.hrtime(startTime), 2);
        startTime = null;
      }
    });
  }
}
