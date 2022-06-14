import util from 'util';

export const HANDLER_WITH_META = 'HANDLER_WITH_SCHEMA';

// export const pick = <T extends Record<string, unknown>, K extends keyof T>(
//   obj: T,
//   keys: readonly K[],
// ) => {
//   Object.entries(obj).filter(([key]) => {
//     return (keys as readonly string[]).includes(key);
//   });
// };

// fork from https://github.com/nodejs/node/blob/master/lib/internal/errors.js
export const getTypeErrorMessage = (actual: unknown) => {
  let msg = '';
  if (actual == null) {
    msg += `. Received ${actual}`;
  } else if (typeof actual === 'function' && actual.name) {
    msg += `. Received function ${actual.name}`;
  } else if (typeof actual === 'object') {
    if (actual.constructor?.name) {
      msg += `. Received an instance of ${actual.constructor.name}`;
    } else {
      const inspected = util.inspect(actual, { depth: -1 });
      msg += `. Received ${inspected}`;
    }
  } else {
    let inspected = util.inspect(actual, { colors: false });
    if (inspected.length > 25) {
      inspected = `${inspected.slice(0, 25)}...`;
    }
    msg += `. Received type ${typeof actual} (${inspected})`;
  }
  return msg;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ERR_INVALID_ARG_TYPE extends Error {
  constructor(funcName: string, expectedType: string, actual: unknown) {
    const message = `[ERR_INVALID_ARG_TYPE]: The '${funcName}' argument must be of type ${expectedType}${getTypeErrorMessage(
      actual,
    )}`;
    super(message);
  }
}

export const validateFunction = (maybeFunc: unknown, name: string) => {
  if (typeof maybeFunc !== 'function') {
    throw new ERR_INVALID_ARG_TYPE(name, 'function', maybeFunc);
  }
  return true;
};

export const isWithMetaHandler = (handler: any) => {
  return typeof handler === 'function' && handler[HANDLER_WITH_META];
};
