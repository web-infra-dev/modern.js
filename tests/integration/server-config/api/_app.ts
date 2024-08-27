import { hook } from '@modern-js/runtime/server';
import type { NextFunction, Request, Response } from 'express';

export default hook(({ addMiddleware }: { addMiddleware: any }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    next();
  });
});
