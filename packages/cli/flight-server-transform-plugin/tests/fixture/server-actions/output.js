/* @modern-js-rsc-metadata
{"directive":"server","exportNames":[{"exportName":"foo"},{"exportName":"bar"},{"exportName":"b"},{"exportName":"default"}]}*/
'use server';
import { registerServerReference } from "@modern-js/runtime/rsc/server";
export async function foo() {
  return 'foo';
}
registerServerReference(foo, module.id, "foo");

export const bar = async () => 'bar';
registerServerReference(bar, module.id, "bar");

const baz = async () => 'baz';
registerServerReference(baz, module.id, "b");

export { baz as b };

export const qux = 'qux';

async function qoo() {
  return 'qoo';
}
registerServerReference(qoo, module.id, "default");

export default qoo;
