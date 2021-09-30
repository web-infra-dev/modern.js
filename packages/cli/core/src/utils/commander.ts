import { program, Command } from 'commander';

declare module 'commander' {
  interface Command {
    commandsMap: Map<string, Command>;
  }
}

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

export { program, Command };
