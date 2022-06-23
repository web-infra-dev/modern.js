import { createContext } from '../farrow-pipeline';

export const RunnerContext = createContext<any>(null);

export const useRunner = () => RunnerContext.get();
