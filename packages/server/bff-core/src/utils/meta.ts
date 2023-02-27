export const HANDLER_WITH_META = 'HANDLER_WITH_META';
export const INPUT_PARAMS_DECIDER = 'INPUT_PARAMS_DECIDER';

export const isWithMetaHandler = (handler: any) => {
  return typeof handler === 'function' && handler[HANDLER_WITH_META];
};

export const isInputParamsDeciderHandler = (handler: any) => {
  return typeof handler === 'function' && handler[INPUT_PARAMS_DECIDER];
};
