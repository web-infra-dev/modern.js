export const HANDLER_WITH_META = 'HANDLER_WITH_META';

export const isWithMetaHandler = (handler: any) => {
  return typeof handler === 'function' && handler[HANDLER_WITH_META];
};
