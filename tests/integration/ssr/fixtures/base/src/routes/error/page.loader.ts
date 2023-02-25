export default async () => {
  const data = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('error occurs'));
    }, 200);
  });

  return data;
};
