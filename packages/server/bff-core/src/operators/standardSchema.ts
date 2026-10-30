/**
 * The Standard Schema interface (https://standardschema.dev), implemented by
 * Zod 3.24+ and Zod 4.
 *
 * Operator types are written against this interface instead of `zod` so they
 * don't depend on which `zod` copy the package manager links next to
 * bff-core. A Zod 3 schema must type-check even when bff-core resolves Zod 4,
 * and the other way round.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaProps<Input, Output>;
}

export interface StandardSchemaProps<Input = unknown, Output = Input> {
  readonly version: 1;
  readonly vendor: string;
  readonly validate: (
    value: unknown,
  ) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
  readonly types?: StandardSchemaTypes<Input, Output> | undefined;
}

export type StandardSchemaResult<Output> =
  StandardSchemaSuccessResult<Output> | StandardSchemaFailureResult;

export interface StandardSchemaSuccessResult<Output> {
  readonly value: Output;
  readonly issues?: undefined;
}

export interface StandardSchemaFailureResult {
  readonly issues: ReadonlyArray<StandardSchemaIssue>;
}

export interface StandardSchemaIssue {
  readonly message: string;
  readonly path?:
    ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
}

export interface StandardSchemaTypes<Input = unknown, Output = Input> {
  readonly input: Input;
  readonly output: Output;
}

/**
 * Zod schemas created before Standard Schema support (Zod < 3.24) only expose
 * `_input`, `_output` and `parseAsync`.
 */
export interface ZodLikeSchema<Input = unknown, Output = Input> {
  readonly _input: Input;
  readonly _output: Output;
  parseAsync(data: unknown): Promise<Output>;
}

export type ValidationSchema = StandardSchemaV1 | ZodLikeSchema;

export type InferSchemaInput<Schema extends ValidationSchema> =
  Schema extends StandardSchemaV1
    ? NonNullable<Schema['~standard']['types']>['input']
    : Schema extends { readonly _input: infer Input }
      ? Input
      : unknown;

export type InferSchemaOutput<Schema extends ValidationSchema> =
  Schema extends StandardSchemaV1
    ? NonNullable<Schema['~standard']['types']>['output']
    : Schema extends { readonly _output: infer Output }
      ? Output
      : unknown;
