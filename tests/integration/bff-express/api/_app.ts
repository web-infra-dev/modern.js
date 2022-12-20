import { hook } from '@modern-js/runtime/server';
import { Request, Response, NextFunction } from 'express';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/bff-api/foo') {
      res.end('foo');
    } else {
      next();
    }
  });
});
