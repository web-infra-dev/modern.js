import { hook } from '@modern-js/runtime/server';
import type { Request, Response, NextFunction } from 'express';

export default hook(({ addMiddleware }: { addMiddleware: any }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    next();
  });
});
