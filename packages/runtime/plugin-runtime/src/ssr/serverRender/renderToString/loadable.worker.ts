import { RenderHandler } from './type';

export const toHtml: RenderHandler = (jsx, _renderer, next) => {
  return next(jsx);
};
