export const getFullArgv = () => {
  return process.env.MODERN_ARGV?.split(' ') || process.argv;
};

export const getArgv = () => {
  return getFullArgv().slice(2);
};

export const getCommand = () => {
  const args = getArgv();
  const command = args[0];
  return command;
};

export const isDevCommand = () => {
  const command = getCommand();
  return command === 'dev' || command === 'start';
};
