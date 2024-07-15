const sleep = () =>
  new Promise(resolve => {
    console.log('custom bootstrap');
    setTimeout(resolve, 300);
  });

export default (_App: React.ComponentType, bootstrap: () => void) => {
  // do something before bootstrap...
  return sleep().then(() => {
    return bootstrap();
  });
};
