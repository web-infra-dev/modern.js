import '@modern-js/utils';

declare module '@modern-js/utils/compiled/commander' {
  export interface Command {
    $$libraryName: string;
  }
}
