import { createDebugger, isObject } from '@modern-js/utils';
import { cloneDeep } from '@modern-js/utils/lodash';
import { PluginValidateSchema } from '../types';
import { source } from './source';
import { testing } from './testing';
import { tools } from './tools';

const debug = createDebugger('validate-schema');

export const patchSchema = (
  pluginSchemas: Array<PluginValidateSchema | PluginValidateSchema[]>,
) => {
  const finalSchema = cloneDeep({
    type: 'object',
    additionalProperties: false,
    properties: {
      source,
      tools,
      testing,
    },
  });

  const findTargetNode = (props: string[]) => {
    let node: any = finalSchema.properties;

    for (const prop of props) {
      if (!node[prop]) {
        node[prop] = {
          type: 'object',
          additionalProperties: false,
        };
      }
      node = node[prop as keyof typeof node];

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

    if (!targetNode.hasOwnProperty(mountProperty)) {
      targetNode[mountProperty as string] = cloneDeep(schema);
    }
  }

  debug(`final validate schema: %o`, finalSchema);

  return finalSchema;
};
