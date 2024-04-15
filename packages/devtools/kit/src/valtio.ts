import { PromiseStub, applySettled, traversePromises } from './promise';

export type Path = (string | symbol)[];
export type Op =
  | [op: 'set', path: Path, value: unknown, prevValue: unknown]
  | [op: 'delete', path: Path, prevValue: unknown]
  | [op: 'resolve', path: Path, value: unknown]
  | [op: 'reject', path: Path, error: unknown];

export const resolvePaths = (obj: any, path: Path) => {
  let current = obj;
  for (const key of path) {
    current = current[key];
  }
  return current;
};

export const applyOperation = (state: Record<any, any>, op: Op) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [operation, path, value, _prevValue] = op;
  const dirnames = path.slice(0, -1);
  const basename = path[path.length - 1];
  const parent = resolvePaths(state, dirnames);
  if (operation === 'delete') {
    delete parent[basename];
  } else if (operation === 'set') {
    if (value instanceof PromiseStub) {
      parent[basename] = value.promise;
    } else {
      parent[basename] = value;
    }
  } else {
    const promise = parent[basename];
    let promiseStub: PromiseStub<any>;
    if (promise instanceof PromiseStub) {
      promiseStub = promise;
    } else {
      try {
        promiseStub = PromiseStub.get(promise);
      } catch {
        promiseStub = PromiseStub.create();
      }
    }
    if (operation === 'resolve') {
      promiseStub.resolve(value);
    } else {
      promiseStub.reject(value);
    }
  }
};

export const extractSettledOperations = async (
  state: object,
): Promise<Op[]> => {
  const ops: Op[] = [];
  const _promises: Promise<void>[] = [];
  for (const [promise, path] of traversePromises(state)) {
    const sendResolveMessage = (value: unknown) => {
      ops.push(['resolve', path, value]);
    };
    const sendRejectMessage = (error: unknown) => {
      ops.push(['reject', path, error]);
    };
    const _promise = applySettled(promise)
      .then(sendResolveMessage)
      .catch(sendRejectMessage);
    _promises.push(_promise);
  }
  await Promise.all(_promises);
  return ops;
};
