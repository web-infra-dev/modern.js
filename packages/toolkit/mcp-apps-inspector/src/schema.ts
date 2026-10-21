/** Produce editable JSON examples, not guaranteed schema-valid values. */
export function schemaExample(
  schema: Record<string, unknown>,
  depth = 0,
): unknown {
  if (depth > 6) return null;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.examples) && schema.examples.length)
    return schema.examples[0];
  if (schema.const !== undefined) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  for (const key of ['oneOf', 'anyOf']) {
    const variants = schema[key];
    if (
      Array.isArray(variants) &&
      variants[0] &&
      typeof variants[0] === 'object'
    )
      return schemaExample(variants[0], depth + 1);
  }
  const type = Array.isArray(schema.type)
    ? schema.type.find(type => type !== 'null')
    : schema.type;
  if (type === 'object' || schema.properties) {
    const properties = schema.properties as
      Record<string, Record<string, unknown>> | undefined;
    return Object.fromEntries(
      Object.entries(properties ?? {})
        .filter(
          ([key, value]) =>
            !Array.isArray(schema.required) ||
            schema.required.includes(key) ||
            value.default !== undefined,
        )
        .map(([key, value]) => [key, schemaExample(value, depth + 1)]),
    );
  }
  if (type === 'array') return [];
  if (type === 'boolean') return false;
  if (type === 'number' || type === 'integer')
    return typeof schema.minimum === 'number' ? schema.minimum : 0;
  if (type === 'null') return null;
  return '';
}
