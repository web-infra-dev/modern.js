export const createBistate = <State extends Record<string, any>>(
  initialState: State,
  previousProxy: State | null = null,
): State => {
  if (!isArray(initialState) && !isObject(initialState)) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Expected initialState to be array or object, but got ${initialState}`,
    );
  }

  const scapegoat = (isArray(initialState) ? [] : {}) as State;
  const target = (isArray(initialState) ? [] : {}) as State;

  let parent: any = Symbol('top');
  const setParent = (input: any) => {
    parent = input;
  };
  const getParent = () => parent;
  const deleteParent = () => {
    parent = null;
  };

  const internal = {
    setParent,
    getParent,
    deleteParent,
  };

  const handlers: ProxyHandler<State> = {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    get: (target, key) => {
      if (key === BISTATE) {
        return internal;
      }

      if (scapegoat) {
        return Reflect.get(scapegoat, key);
      } else {
        return Reflect.get(target, key);
      }
    },
    set: (current, key, value, reciver) => {
      if (hasFreezed(reciver, key)) {
        throw new Error(`You can change it, because it has been freezed`);
      } else if (scapegoat) {
        const result = Reflect.set(scapegoat, key, value);
        return result;
      } else {
        throw new Error(
          `state is immutable, it's not allowed to set property: ${key.toString()}`,
        );
      }
    },
    deleteProperty: (current, key) => {
      throw new Error(`It's not allowed to delete property: ${key.toString()}`);
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
    has: (target, key) => {
      if (scapegoat) {
        return Reflect.has(scapegoat, key);
      } else {
        return Reflect.has(target, key);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
    ownKeys: target => {
      if (scapegoat) {
        return Reflect.ownKeys(scapegoat);
      } else {
        return Reflect.ownKeys(target);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
    getPrototypeOf: target => {
      if (scapegoat) {
        return Reflect.getPrototypeOf(scapegoat);
      } else {
        return Reflect.getPrototypeOf(target);
      }
    },
    setPrototypeOf: () => {
      throw new Error(
        `bistate only supports plain object or array, it's not allowed to setPrototypeOf`,
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
    getOwnPropertyDescriptor: (target, prop) => {
      if (scapegoat) {
        return Reflect.getOwnPropertyDescriptor(scapegoat, prop);
      } else {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      }
    },
    defineProperty: (_, property) => {
      throw new Error(
        `bistate only supports plain object or array, it's not allowed to defineProperty: ${property.toString()}`,
      );
    },
  };

  const currentProxy = new Proxy(target, handlers);

  if (isArray(currentProxy)) {
    fillArrayBistate(
      currentProxy,
      initialState,
      target,
      scapegoat,
      previousProxy,
    );
  } else {
    fillObjectBistate(
      currentProxy,
      initialState,
      target,
      scapegoat,
      previousProxy,
    );
  }

  // clear previousProxy
  // eslint-disable-next-line no-param-reassign
  previousProxy = null;
  // clear initialState
  // eslint-disable-next-line no-param-reassign
  initialState = null as any;

  return currentProxy;
};

export default function <State extends Record<string, any>>(
  initialState: State,
) {
  return createBistate(initialState, null);
}

const BISTATE = Symbol('BISTATE');

export const isBistate = (input: any) => Boolean(input?.[BISTATE]);

export const { isArray } = Array;

export const isObject = (input: any): input is Record<string, any> => {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(input) === proto;
};

export const isThenable = (input: any): input is PromiseLike<any> =>
  // eslint-disable-next-line promise/prefer-await-to-then
  Boolean(input && typeof input.then === 'function');

const getBistateValue = (value: any, currentProxy: any, previousProxy: any) => {
  let status = '';

  /**
   * if previousProxy exists, it is in reusing phase
   * otherwise is in initializing phase
   */
  if (previousProxy) {
    if (isBistate(value)) {
      const parent = value[BISTATE].getParent();

      // reuse bistate
      if (parent === previousProxy) {
        status = 'reuse';
      } else {
        status = 'create';
      }
    } else if (isArray(value) || isObject(value)) {
      status = 'create';
    }
  } else if (isArray(value) || isObject(value)) {
    status = 'create';
  }

  if (status === 'reuse') {
    // eslint-disable-next-line no-param-reassign
    value = value[BISTATE].compute();
    value[BISTATE].setParent(currentProxy);
  } else if (status === 'create') {
    // eslint-disable-next-line no-param-reassign
    value = createBistate(value);
    value[BISTATE].setParent(currentProxy);
  }

  return value;
};

const fillObjectBistate = (
  currentProxy: any,
  initialObject: any,
  target: any,
  scapegoat: any,
  previousProxy: any,
  // eslint-disable-next-line max-params
) => {
  for (const key in initialObject) {
    const value = getBistateValue(
      initialObject[key],
      currentProxy,
      previousProxy,
    );
    scapegoat[key] = value;
    target[key] = value;
  }
};

const fillArrayBistate = (
  currentProxy: any,
  initialArray: any,
  target: any,
  scapegoat: any,
  previousProxy: any,
  // eslint-disable-next-line max-params
) => {
  for (let i = 0; i < initialArray.length; i++) {
    const item = getBistateValue(initialArray[i], currentProxy, previousProxy);
    scapegoat[i] = item;
    target[i] = item;
  }
};

export type Path = (string | symbol | number)[];

export const isSubArray = (
  base: any[],
  target: any[],
  equal = (a: any, b: any) => a === b,
) => {
  for (let i = 0; i < base.length; i++) {
    if (equal(base[i], target[0])) {
      let isEqual = true;

      for (let j = 0; j < target.length; j++) {
        if (!equal(base[i + j], target[j])) {
          isEqual = false;
          break;
        }
      }

      if (isEqual) {
        return true;
      }
    }
  }

  return false;
};

const createFreezeStore = () => {
  const map: Record<symbol, Path[]> = {};

  const freeze = (symbol: symbol, path: Path) => {
    if (map[symbol]) {
      map[symbol].push(path);
    } else {
      map[symbol] = [path];
    }
  };

  const hasFreezed = (key: symbol, path: Path): boolean => {
    if (map[key]) {
      return map[key].some(
        (base: Path) => isSubArray(base, path) || isSubArray(path, base),
      );
    } else {
      return false;
    }
  };

  return {
    freeze,
    hasFreezed,
  };
};
const store = createFreezeStore();
export const freeze = <I>(input: I, key: keyof I) => {
  const [path, top] = getPathAndTop(input, key);

  if (top) {
    store.freeze(top, path);
  } else {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`input: ${input} is not bistate`);
  }
};
export const hasFreezed = <I>(input: I, key: keyof I) => {
  const [path, top] = getPathAndTop(input, key);

  if (top) {
    return store.hasFreezed(top, path);
  } else {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`input: ${input} is not bistate`);
  }
};

const getPathAndTop = <I>(
  current: I,
  key: keyof I,
): readonly [Path, symbol | null] => {
  const path: (string | symbol)[] = [key as any];
  let top: null | symbol = null;

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const getParantpath = (current: any, parent: any) => {
    if (!parent) {
      return;
    }
    if (typeof parent === 'symbol') {
      top = parent;
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    for (const key in parent) {
      if (parent[key] === current) {
        path.push(key);
        getParantpath(parent, parent?.[BISTATE]?.getParent());
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  getParantpath(current, current?.[BISTATE]?.getParent());

  return [path, top] as const;
};
