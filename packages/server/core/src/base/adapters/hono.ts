import { NodeRequest, NodeResponse } from '@core/plugin';
import { HonoContext, HonoNodeEnv, NextFunction } from '../types';

type Handler =
  | ((req: NodeRequest, res: NodeResponse) => void)
  | ((req: NodeRequest, res: NodeResponse, next: NextFunction) => void);

export const httpCallBack2HonoMid = (handler: Handler) => {
  return (context: HonoContext<HonoNodeEnv>, next: NextFunction) => {
    const { req, res } = context.env.node!;
    handler(req, res, next);
  };
};
