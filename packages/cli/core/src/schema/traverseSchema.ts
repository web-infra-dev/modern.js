import { patchSchema } from './patchSchema';

export const traverseSchema = (schema: ReturnType<typeof patchSchema>) => {
  const keys: string[] = [];

  const traverse = (
    { properties }: { properties: any },
    old: string[] = [],
  ) => {
    for (const key of Object.keys(properties)) {
      const current = [...old, key];
      if (properties[key].type === 'object' && properties[key].properties) {
        traverse(properties[key], current);
      } else {
        keys.push(current.join('.'));
      }
    }
  };

  traverse(schema);

  return keys;
};
