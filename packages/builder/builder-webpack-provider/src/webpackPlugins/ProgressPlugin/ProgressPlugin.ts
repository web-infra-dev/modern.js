import webpack from 'webpack';
import { logger } from '@modern-js/utils/logger';
import prettyTime from '@modern-js/builder-shared/pretty-time';
import { bus, createFriendlyPercentage } from './helpers';
import { createNonTTYLogger } from './helpers/nonTty';
import type { Props } from './helpers/type';

export interface ProgressOptions
  extends Omit<Partial<Props>, 'message' | 'total' | 'current' | 'done'> {
  id?: string;
  clearOnDone?: boolean;
  disableTsChecker?: boolean;
}

export class ProgressPlugin extends webpack.ProgressPlugin {
  readonly name: string = 'ProgressPlugin';

  id: string;

  hasCompileErrors: boolean = false;

  compileTime: string | null = null;

  disableTsChecker?: boolean;

  constructor(options: ProgressOptions) {
    const { id = 'Modern', clearOnDone = false, disableTsChecker } = options;

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
            hasErrors: this.hasCompileErrors,
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
            hasErrors: this.hasCompileErrors,
            compileTime: this.compileTime,
          });
        }
      },
    });

    this.id = id;
    this.disableTsChecker = disableTsChecker;
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
        this.hasCompileErrors = stat.hasErrors();
        this.compileTime = prettyTime(process.hrtime(startTime), 0);
        startTime = null;

        if (!this.hasCompileErrors) {
          logger.ready(`${this.id} compiled in ${this.compileTime}`);
        }
      }
    });
  }
}
