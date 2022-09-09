export const addExitListener = async (fn: () => Promise<void>) => {
  const { default: onExit } = await import('signal-exit');

  onExit(async code => {
    if (code === 0) {
      return;
    }

    await fn();
  });
};
