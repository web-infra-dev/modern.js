interface DepInfo {
  type: 'object' | 'string' | 'buffer';
  content?: any;
  text?: string;
  buf?: Buffer;
}

export const loadDeps = (
  keyParam: string,
  deps: Record<string, any>,
): DepInfo | undefined => {
  if (typeof deps !== 'object') {
    return;
  }

  let key = keyParam;
  if (key.startsWith('/')) {
    key = key.substring(1);
  }

  let value: any;
  if (deps.hasOwnProperty(key)) {
    value = deps[key];
  } else {
    const s = ['.js', '.json', '.mjs'].find(x => deps.hasOwnProperty(key + x));
    if (s) {
      value = deps[s];
    }
  }

  if (typeof value === 'undefined') {
    return;
  }

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
