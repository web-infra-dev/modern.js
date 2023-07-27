import {
  ErrorFormatter,
  ErrorTransformer,
  ThrowableType,
} from '../shared/types';
import { prettyFormatter } from '../formatter';
import {
  cleanMessageTransformer,
  flattenCausesTransformer,
  moduleParseErrorTransformer,
} from '../transformer';

const outputFormattedError = (msg: string, type: ThrowableType): any => {
  if (type === 'error') {
    console.error(msg);
  } else if (type === 'warning') {
    console.warn(msg);
  }
};

export const builtinTransformers = [
  cleanMessageTransformer,
  flattenCausesTransformer,
  moduleParseErrorTransformer,
] as const;

export interface ContextInitiationOptions {
  cwd?: string;
  output?: typeof outputFormattedError;
  type?: ThrowableType;
  withSources?: boolean;
  formatters?: boolean | ErrorFormatter[];
  transformers?: boolean | ErrorTransformer[];
}

export class Context {
  cwd: string;

  output: typeof outputFormattedError;

  type: ThrowableType;

  withSources: boolean;

  formatters: ErrorFormatter[] = [];

  transformers: ErrorTransformer[] = [];

  constructor(options: ContextInitiationOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.output = options.output || outputFormattedError;
    this.type = options.type || 'error';
    this.withSources = options.withSources ?? true;

    if (Array.isArray(options.formatters)) {
      this.formatters.push(...options.formatters);
    } else if (options.formatters !== false) {
      this.formatters.push(prettyFormatter);
    }

    if (Array.isArray(options.transformers)) {
      this.transformers.push(...options.transformers);
    } else if (options.transformers !== false) {
      this.transformers.push(...builtinTransformers);
    }
  }
}
