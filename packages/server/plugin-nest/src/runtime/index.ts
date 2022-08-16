import type { Request, Response, NextFunction } from 'express';
import { useContext, NestContext } from '../context';

export const hook = (
  attacher: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void | Promise<void>,
) => attacher;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
declare module '@modern-js/runtime/server' {
  export function useContext(): NestContext;
}

export { useContext };
