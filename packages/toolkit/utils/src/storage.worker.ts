const createStorage = <T>() => {
  const storage = {};

  const run = <O>(context: T, cb: () => O | Promise<O>): Promise<O> => {
    if (!storage) {
      throw new Error(`Unable to use async_hook, please confirm the node version >= 12.17
        `);
    }

    return new Promise<O>((resolve, _reject) => {
      return resolve(cb());
    });
  };

  const useContext: () => T = () => {
    if (!storage) {
      throw new Error(`Unable to use async_hook, please confirm the node version >= 12.17
        `);
    }
    const context = storage as T;
    if (!context) {
      throw new Error(
        `Can't call useContext out of scope, make sure @modern-js/utils is a single version in node_modules`,
      );
    }

    return context;
  };

  return {
    run,
    useContext,
  };
};

export { createStorage };
