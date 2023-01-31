export const getCommand = () => {
  const args = process.argv.slice(2);
  const command = args[0];
  return command;
};

export const isDevCommand = () => {
  const command = getCommand();
  return command === 'dev' || command === 'start';
};
