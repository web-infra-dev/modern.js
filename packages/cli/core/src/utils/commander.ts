import { program, Command } from '@modern-js/utils';

declare module '@modern-js/utils/compiled/commander' {
  export interface Command {
    commandsMap: Map<string, Command>;
  }
}

export function initCommandsMap() {
  if (!program.hasOwnProperty('commandsMap')) {
    Object.defineProperty(program, 'commandsMap', {
      get() {
        const map = new Map<string, Command>();
        for (const command of program.commands) {
          map.set((command as any)._name, command);
        }
        return map;
      },
      configurable: false,
    });
  }
}

export { program };
