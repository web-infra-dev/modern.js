import { get } from '@modern-js/utils/lodash';

interface DepInfo {
  type: 'object' | 'string' | 'buffer';
  content?: any;
  text?: string;
  buf?: Buffer;
}

export const loadDeps = (key: string[], deps: any): DepInfo | undefined => {
  const value = get(deps, key);
  if (typeof value === 'undefined') {
    return;
  }

  // TODO: 只能取叶子结点
  if (typeof value === 'object') {
    if (typeof value._DEP_TEXT === 'string') {
      return {
        type: 'string',
        text: value._DEP_TEXT,
      };
    }
    if (typeof value._DEP_BUF !== 'undefined') {
      return {
        type: 'buffer',
        text: value._DEP_BUF,
      };
    }
  }

  return {
    type: 'object',
    content: value,
  };
};
