import type { NextFunction, Request, Response } from 'express';

export const hook = (
  attacher: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void | Promise<void>,
) => attacher;
