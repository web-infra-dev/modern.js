import { Console } from 'console';

global.console.Console = Console;

// Disable chalk in test
process.env.FORCE_COLOR = '0';
