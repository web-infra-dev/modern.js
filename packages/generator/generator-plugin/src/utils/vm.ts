import { get } from '@modern-js/utils/lodash';
import { NodeVM } from 'vm2';

const cache: Record<string, unknown> = {};

const vm = new NodeVM({
  console: 'inherit',
  sandbox: { __cache: cache },
  require: {
    external: true,
    builtin: [],
  },
});

export function requireModuleWithVm(module: string) {
  vm.run(`__cache.module=require('${module}')`);
  return get(cache, ['module', 'default']) || cache.module;
}
