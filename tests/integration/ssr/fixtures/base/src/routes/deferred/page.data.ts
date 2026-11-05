const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let calls = 0;

export const loader = () => {
  calls += 1;
  const call = calls;
  return {
    call,
    // resolves within `ssr.deferredDataTimeout`: rendered on the server
    fast: wait(10).then(() => `fast from call ${call}`),
    // misses the timeout: the browser loads it with one more call
    slow: wait(400).then(() => `slow from call ${call}`),
    // fails: only its own region shows the error
    broken: wait(10).then(() => {
      throw new Error('broken source');
    }),
  };
};
