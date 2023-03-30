export const getArgv = () => {
  return (process.env.MODERN_ARGV?.split(' ') || process.argv).slice(2);
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
