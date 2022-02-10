const wait = (time = 0) =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });

export { wait };
