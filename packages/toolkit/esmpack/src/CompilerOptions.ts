import type {
  InputOptions as RollupInputOptions,
  IsExternal,
  OutputOptions as RollupOutputOptions,
} from 'rollup';

export type InputOptions = Omit<RollupInputOptions, 'input' | 'external'> & {
  input?: EntryInput;
  external?: IsExternal;
};

export type OutputOptions = RollupOutputOptions;

export interface EntryInput {
  [entryAlias: string]: string;
}
