import { hook } from '@modern-js/runtime/server';
import type { NextFunction, Request, Response } from 'express';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, x-header, Authorization, X-Requested-With, x-env',
    );

    if (req.path === '/api-app/foo') {
      res.end('foo');
    } else {
      res.setHeader('x-env', 'test');
      next();
    }
  });
});
