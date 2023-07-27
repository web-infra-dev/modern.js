import { prettyFormatter } from './formatter';
import { Options } from './plugin';
import {
  ErrorFormatter,
  ErrorTransformer,
  ThrowableType,
} from './shared/types';
import {
  cleanMessageTransformer,
  flattenCausesTransformer,
  moduleParseErrorTransformer,
} from './transformer';

export class Context {
  withSources: boolean;

  formatters: ErrorFormatter[] = [];

  transformers: ErrorTransformer[] = [];

  constructor(options: Options = {}) {
    this.output = options.output ?? this.output;
    this.withSources = options.withSources ?? true;

    if (Array.isArray(options.formatters)) {
      this.formatters.push(...options.formatters);
    } else if (options.formatters !== false) {
      this.formatters.push(prettyFormatter);
    }

    if (Array.isArray(options.transformers)) {
      this.transformers.push(...options.transformers);
    } else if (options.transformers !== false) {
      this.transformers.push(
        cleanMessageTransformer,
        flattenCausesTransformer,
        moduleParseErrorTransformer,
      );
    }
  }

  output = (msg: string, type: ThrowableType): void => {
    if (type === 'error') {
      console.error(msg);
    } else if (type === 'warning') {
      console.warn(msg);
    }
  };
}
