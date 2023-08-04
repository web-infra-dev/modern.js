import { LibuildErrorInstance } from '../types';

export class LibuildFailure extends Error {
  readonly errors: LibuildErrorInstance[];

  readonly warnings: LibuildErrorInstance[];

  readonly logLevel: string;

  constructor(errors: LibuildErrorInstance[], warnings: LibuildErrorInstance[], logLevel: string) {
    super();
    this.errors = errors;
    this.warnings = warnings;
    this.logLevel = logLevel;
  }

  toString() {
    const { logLevel, errors, warnings } = this;
    const onlyError = logLevel === 'error';

    if (logLevel === 'silent') {
      return '';
    }

    if ((onlyError && errors.length === 0) || (!onlyError && errors.length === 0 && warnings.length === 0)) {
      return '';
    }

    const msgs: string[] = [];

    if (onlyError) {
      msgs.push(`Build failed with ${errors.length} error:`, ...errors.map((item) => item.toString()), '');
    } else {
      const title =
        errors.length === 0
          ? `Build succuss with ${warnings.length} warning:`
          : `Build failed with ${errors.length} error, ${warnings.length} warning:`;

      msgs.push(title, ...errors.map((item) => item.toString()), ...warnings.map((item) => item.toString()), '');
    }
    return msgs.join('\n\n');
  }
}
