async function mulAsync(a: number, b: number) {
  return new Promise((resolve, reject) => {
    resolve(a * b);
  });
}
mulAsync(1, 1);
