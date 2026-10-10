import type {
  JsonSchema,
  RemoteToolHandlerContext,
  RemoteToolHandlerResult,
  ToolConfig,
} from './config';

/** Infer the supported JSON Schema forms; unknown forms remain unknown. */
export type InferSchema<S> = S extends { const: infer V }
  ? V
  : S extends { enum: readonly (infer V)[] }
    ? V
    : S extends { anyOf: readonly (infer V)[] }
      ? InferSchema<V>
      : S extends { oneOf: readonly (infer V)[] }
        ? InferSchema<V>
        : S extends { type: 'string' }
          ? string
          : S extends { type: 'number' | 'integer' }
            ? number
            : S extends { type: 'boolean' }
              ? boolean
              : S extends { type: 'null' }
                ? null
                : S extends { type: 'array'; items: infer I }
                  ? InferSchema<I>[]
                  : S extends { type: 'object'; properties: infer P }
                    ? {
                        -readonly [K in keyof P as K extends RequiredKeys<S>
                          ? K
                          : never]: InferSchema<P[K]>;
                      } & {
                        -readonly [K in keyof P as K extends RequiredKeys<S>
                          ? never
                          : K]?: InferSchema<P[K]>;
                      }
                    : unknown;

type RequiredKeys<S> = S extends { required: readonly (infer K)[] } ? K : never;

export type DefinedTool<S, R> = ToolConfig & {
  /** Type marker only; no runtime property is emitted. */
  readonly $types?: { input: InferSchema<S>; result: Awaited<R> };
};

export type InferToolInput<T> = T extends {
  readonly $types?: { input: infer I };
}
  ? I
  : never;
export type InferToolOutput<T> = T extends {
  readonly $types?: { result: infer R };
}
  ? R extends { structuredContent: infer O }
    ? O
    : unknown
  : never;

/** Keep JSON Schema and its typed handler together; execution validates input. */
export function defineTool<
  const S extends JsonSchema,
  R extends RemoteToolHandlerResult | Promise<RemoteToolHandlerResult>,
>(
  definition: Omit<ToolConfig, 'inputSchema' | 'handler'> & {
    inputSchema: S;
    handler: (input: InferSchema<S>, context: RemoteToolHandlerContext) => R;
  },
): DefinedTool<S, R> {
  return {
    ...definition,
    handler: (input, context) =>
      definition.handler(input as InferSchema<S>, context),
  };
}
