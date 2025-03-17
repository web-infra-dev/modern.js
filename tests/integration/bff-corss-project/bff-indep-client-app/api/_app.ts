import { hook } from '@modern-js/runtime/server';
import type { NextFunction, Request, Response } from 'express';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api-app/foo') {
      res.end('foo');
    } else {
      next();
    }
  });
});
