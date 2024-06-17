const sleep = () => new Promise(resolve => setTimeout(resolve, 300));

export default (_App: React.ComponentType, bootstrap: () => void) => {
  // do something before bootstrap...
  sleep().then(() => {
    bootstrap();
  });
};
