import { NodeRequest, NodeResponse } from '@core/plugin';
import { HonoContext, HonoNodeEnv } from '../types';

type Handler = (req: NodeRequest, res: NodeResponse) => void;

export const httpCallBack2HonoMid = (handler: Handler) => {
  return (context: HonoContext<HonoNodeEnv>) => {
    const { req, res } = context.env.node!;
    return handler(req, res);
  };
};
