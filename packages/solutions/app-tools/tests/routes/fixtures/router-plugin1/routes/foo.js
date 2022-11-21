const foo = async () => {
  const bar = await import(/* webpackChunkName: "bar" */ './bar');
  const res = bar();
  return `${res}foo`;
};

export default foo;
