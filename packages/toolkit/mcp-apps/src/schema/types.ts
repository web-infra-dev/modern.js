import type { InputSchemaKeyword } from './input';

export type JsonSchema = Record<string, unknown>;

/** Infer the supported JSON Schema forms; unknown forms remain unknown. */
type InferJsonSchema<S> = S extends { const: infer V }
  ? V
  : S extends { enum: readonly (infer V)[] }
    ? V
    : S extends { anyOf: readonly (infer V)[] }
      ? InferJsonSchema<V>
      : S extends { oneOf: readonly (infer V)[] }
        ? InferJsonSchema<V>
        : S extends { type: 'string' }
          ? string
          : S extends { type: 'number' | 'integer' }
            ? number
            : S extends { type: 'boolean' }
              ? boolean
              : S extends { type: 'null' }
                ? null
                : S extends { type: 'array'; items: infer I }
                  ? InferJsonSchema<I>[]
                  : S extends { type: 'object'; properties: infer P }
                    ? {
                        -readonly [
                          K in keyof P as K extends RequiredKeys<S> ? K : never
                        ]: InferJsonSchema<P[K]>;
                      } & {
                        -readonly [
                          K in keyof P as K extends RequiredKeys<S> ? never : K
                        ]?: InferJsonSchema<P[K]>;
                      }
                    : unknown;

/** Property maps are a root-only shorthand; nested schemas remain JSON Schema. */
export type InferSchema<S> =
  S extends Record<string, JsonSchema>
    ? keyof S extends never
      ? unknown
      : Extract<keyof S, InputSchemaKeyword> extends never
        ? {
            -readonly [
              K in keyof S as S[K] extends { optional: true } ? never : K
            ]: InferJsonSchema<S[K]>;
          } & {
            -readonly [
              K in keyof S as S[K] extends { optional: true } ? K : never
            ]?: InferJsonSchema<S[K]>;
          }
        : InferJsonSchema<S>
    : InferJsonSchema<S>;

type RequiredKeys<S> = S extends { required: readonly (infer K)[] } ? K : never;
