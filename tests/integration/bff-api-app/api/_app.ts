import { hook } from '@modern-js/runtime/server';
import type { NextFunction, Request, Response } from 'express';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('x-env', 'test');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
});
