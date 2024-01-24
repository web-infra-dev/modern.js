export const pTimeout = <T>(promise: Promise<T>, timeout: number) =>
  new Promise<T>((resolve, reject) => {
    let active = true;
    const timer = setTimeout(() => {
      active = false;
      reject(new Error('Promise Timeout'));
    }, timeout);
    promise.then(res => {
      active && resolve(res);
      clearTimeout(timer);
    });
    promise.catch(reject);
  });
