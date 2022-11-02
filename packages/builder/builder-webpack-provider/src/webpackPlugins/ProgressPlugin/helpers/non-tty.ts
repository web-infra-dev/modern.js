import { logger } from '@modern-js/utils';

export function createNonTTYLogger() {
  let prevPercentage = 0;

  const log = ({
    id,
    done,
    current,
    hasErrors,
    compileTime,
  }: {
    id: string;
    done: boolean;
    current: number;
    hasErrors: boolean;
    compileTime: string | null;
  }) => {
    if (done) {
      // avoid printing done twice
      if (prevPercentage === 100) {
        return;
      }

      prevPercentage = 100;
      if (hasErrors) {
        logger.error(`[${id}] compile failed in ${compileTime}`);
      } else {
        logger.success(`[${id}] compile done in ${compileTime}`);
      }
    }
    // print progress when percentage increased by more than 10%
    // because we don't want to spam the console
    else if (current - prevPercentage > 10) {
      prevPercentage = current;
      logger.info(`[${id}] compile progress: ${current.toFixed(0)}%`);
    }
  };

  return {
    log,
  };
}
