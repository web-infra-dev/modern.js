import { Middleware } from 'koa';
import { signale as logger, LAUNCH_EDITOR_ENDPOINT } from '@modern-js/utils';

// try vscode first
const specifiedEditor = 'code';

export const launchEditorMiddleware = (): Middleware => {
  const handleError = (filename: string, errorMessage: string) => {
    logger.error(`Launch ${filename} in editor failed.\n${errorMessage}`);
  };

  return (ctx, next) => {
    if (ctx.url.startsWith(LAUNCH_EDITOR_ENDPOINT)) {
      const filename = ctx.query.filename;
      if (!filename) {
        ctx.status = 500;
        ctx.res.end(
          `launch-editor-middleware: required query param "filename" is missing.`,
        );
      } else {
        require('launch-editor')(filename, specifiedEditor, handleError);
        ctx.status = 200;
        ctx.res.end();
      }
    } else {
      return next();
    }
  };
};
