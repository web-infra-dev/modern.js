import webpack from 'webpack';
import { bus, createFriendlyPercentage } from './helpers';
import prettyTime from '../../../compiled/pretty-time';
import { createNonTTYLogger } from './helpers/non-tty';
import type { Props } from './helpers/type';

export interface ProgressOptions
  extends Omit<Partial<Props>, 'message' | 'total' | 'current' | 'done'> {
  id?: string;
  clearOnDone?: boolean;
}

export class ProgressPlugin extends webpack.ProgressPlugin {
  readonly name: string = 'ProgressPlugin';

  hasErrors: boolean = false;

  compileTime: string | null = null;

  constructor(options: ProgressOptions) {
    const { id = 'Modern', clearOnDone = false } = options;

    const nonTTYLogger = createNonTTYLogger();
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
        // eslint-disable-next-line no-param-reassign
        percentage = friendlyPercentage(percentage);
        const done = percentage === 1;

        if (process.stdout.isTTY) {
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
        } else {
          nonTTYLogger.log({
            id,
            done,
            current: percentage * 100,
            hasErrors: this.hasErrors,
            compileTime: this.compileTime,
          });
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
