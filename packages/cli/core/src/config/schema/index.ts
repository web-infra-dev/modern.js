import { isObject, createDebugger } from '@modern-js/utils';
import { cloneDeep } from '@modern-js/utils/lodash';
import type { JSONSchemaType } from '../../../compiled/ajv';
import { source } from './source';
import { output } from './output';
import { server } from './server';
import { deploy } from './deploy';
import { tools } from './tools';

const debug = createDebugger('validate-schema');

const plugins = {
  type: 'array',
  additionalProperties: false,
};

const dev = {
  type: 'object',
  properties: {
    assetPrefix: { type: ['boolean', 'string'] },
    https: {
      type: 'boolean',
    },
  },
  additionalProperties: false,
};
export interface PluginValidateSchema {
  target: string;
  schema: JSONSchemaType<any>;
}

export const patchSchema = (
  pluginSchemas: Array<PluginValidateSchema | PluginValidateSchema[]>,
) => {
  const finalSchema = cloneDeep({
    type: 'object',
    additionalProperties: false,
    properties: {
      source,
      output,
      server,
      deploy,
      plugins,
      dev,
      tools,
    },
  });

  const findTargetNode = (props: string[]) => {
    let node = finalSchema.properties;

    for (const prop of props) {
      node = node[prop as keyof typeof node] as any;
      if (!node || !isObject(node)) {
        throw new Error(`add schema ${props.join('.')} error`);
      }
      (node as any).properties = (node as any).hasOwnProperty('properties')
        ? (node as any).properties
        : {};

      node = (node as any).properties;
    }
    return node;
  };

  const finalPluginSchemas: PluginValidateSchema[] = [];
  pluginSchemas.forEach(item => {
    if (Array.isArray(item)) {
      finalPluginSchemas.push(...item);
    } else {
      finalPluginSchemas.push(item);
    }
  });
  for (const { target, schema } of finalPluginSchemas) {
    if (!target) {
      throw new Error(`should return target property in plugin schema.`);
    }
    const props = target.split('.');

    const mountProperty = props.pop();

    const targetNode = findTargetNode(props);

    if (!targetNode.hasOwnProperty(mountProperty!)) {
      (targetNode as any)[mountProperty as string] = cloneDeep(schema);
    }
  }

  debug(`final validate schema: %o`, finalSchema);

  return finalSchema;
};

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
