import { createContext } from 'farrow-pipeline';

export const RunnerContext = createContext<any>(null);

export const useRunner = () => {
  const runner = RunnerContext.use().value;

  if (!runner) {
    throw new Error(
      `Can't call useRunner out of scope, it should be placed in hooks of plugin`,
    );
  }

  return runner;
};
