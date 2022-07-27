export function createAsyncHook<Callback extends (...args: any[]) => any>() {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = async (...args: Parameters<Callback>) => {
    const params = [...args];

    for (const cb of callbacks) {
      const result = await cb(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params;
  };

  return {
    tap,
    call,
  };
}
