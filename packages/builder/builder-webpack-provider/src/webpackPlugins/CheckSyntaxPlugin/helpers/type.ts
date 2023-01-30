export interface Location {
  line: number;
  column: number;
}

export interface File {
  path: string;
  line: number;
  column: number;
}

interface SyntaxErrorOptions {
  source: File & { code: string };
  output?: File;
}

export class SyntaxError extends Error {
  source: File & { code: string };

  output: File | undefined;

  constructor(message: string, options: SyntaxErrorOptions) {
    super(message);
    this.source = options.source;
    this.output = options.output;
  }
}

export type AcornParseError = {
  message: string;
  pos: number;
  loc: Location;
};
