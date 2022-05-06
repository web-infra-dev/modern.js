import { program, Command } from '@modern-js/utils';

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

export type { Command };
export { program };
