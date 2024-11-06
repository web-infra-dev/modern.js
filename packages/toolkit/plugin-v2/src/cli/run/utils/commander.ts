import { type Command, program } from '@modern-js/utils';

export const setProgramVersion = (version = 'unknown') => {
  const name = process.argv[1];
  program.name(name).usage('<command> [options]').version(version);
};

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
