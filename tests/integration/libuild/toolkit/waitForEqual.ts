export async function waitForEqual(valueFn: () => string, expectedValue: string) {
  let count = 0;
  return new Promise<void>((resolve, reject) => {
    const id = setInterval(() => {
      try {
        const actualValue = valueFn();
        if (actualValue.includes(expectedValue)) {
          clearInterval(id);
          resolve();
        } else if (++count > 20) {
          clearInterval(id);
          reject();
        }
      } catch (err) {
        clearInterval(id);
        reject(err);
      }
    }, 100);
  });
}
