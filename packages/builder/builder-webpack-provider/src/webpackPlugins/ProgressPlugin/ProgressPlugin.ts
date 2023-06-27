import webpack from 'webpack';
import { logger } from '@modern-js/utils/logger';
import ForkTsCheckerWebpackPlugin from '@modern-js/builder-shared/fork-ts-checker-webpack-plugin';
import { bus, createFriendlyPercentage } from './helpers';
import prettyTime from '../../../compiled/pretty-time';
import { createNonTTYLogger } from './helpers/nonTty';
import type { Props } from './helpers/type';

export interface ProgressOptions
  extends Omit<Partial<Props>, 'message' | 'total' | 'current' | 'done'> {
  id?: string;
  clearOnDone?: boolean;
  showRecompileLog?: boolean;
  disableTsChecker?: boolean;
}

export class ProgressPlugin extends webpack.ProgressPlugin {
  readonly name: string = 'ProgressPlugin';

  hasTypeErrors: boolean = false;

  hasCompileErrors: boolean = false;

  compileTime: string | null = null;

  showRecompileLog: boolean;

  disableTsChecker?: boolean;

  constructor(options: ProgressOptions) {
    const {
      id = 'Modern',
      clearOnDone = false,
      showRecompileLog = false,
      disableTsChecker,
    } = options;

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
            hasErrors: this.hasCompileErrors,
            compileTime: this.compileTime,
          });
        }
      },
    });

    this.showRecompileLog = showRecompileLog;
    this.disableTsChecker = disableTsChecker;
  }

  apply(compiler: webpack.Compiler): void {
    super.apply(compiler);

    let startTime: [number, number] | null = null;
    let isReCompile = false;

    compiler.hooks.compile.tap(this.name, () => {
      // If it is a recompile and there are compilation errors,
      // print a recompile log so that users can know that the recompile
      // is triggered and the above error log is outdated.
      if (
        isReCompile &&
        this.showRecompileLog &&
        (this.hasCompileErrors || this.hasTypeErrors)
      ) {
        logger.info(`Start recompile...\n`);
      }

      this.compileTime = null;
      startTime = process.hrtime();
      isReCompile = true;
    });

    compiler.hooks.done.tap(this.name, stat => {
      if (startTime) {
        this.hasCompileErrors = stat.hasErrors();
        this.compileTime = prettyTime(process.hrtime(startTime), 2);
        startTime = null;
      }
    });

    if (!this.disableTsChecker) {
      const hooks = ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler);

      hooks.start.tap(this.name, change => {
        this.hasTypeErrors = false;
        return change;
      });

      hooks.issues.tap(this.name, issues => {
        this.hasTypeErrors = Boolean(issues.length);
        return issues;
      });
    }
  }
}
