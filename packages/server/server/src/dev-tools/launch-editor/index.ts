import { LAUNCH_EDITOR_ENDPOINT, logger } from '@modern-js/utils';
import { ModernServerContext } from '../../libs/context';
import { NextFunction } from '../../type';

export const createLaunchEditorHandler =
  // eslint-disable-next-line consistent-return
  () => (ctx: ModernServerContext, next: NextFunction) => {
    if (ctx.url.startsWith(LAUNCH_EDITOR_ENDPOINT)) {
      const { filename, line = 1, column = 1 } = ctx.query;
      if (!filename) {
        ctx.status = 500;
        ctx.res.end(
          `launch-editor-middleware: required query param "filename" is missing.`,
        );
      } else {
        require('launch-editor')(
          `${filename as string}:${line as string}:${column as string}`,
          'code',
          (file: string, errorMessage: string) => {
            logger.error(`Launch ${file} in editor failed.\n${errorMessage}`);
          },
        );
        ctx.status = 200;
        ctx.res.end();
      }
    } else {
      return next();
    }
  };
