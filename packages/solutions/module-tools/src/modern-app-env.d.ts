import 'commander';

declare module 'commander' {
  export interface Command {
    $$libraryName: string;
  }
}
