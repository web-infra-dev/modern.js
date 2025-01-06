/* @modern-js-rsc-metadata
{"directive":null,"exportNames":[{"exportName":"foo"},{"exportName":"baz"},{"exportName":"qux"}]}*/
import { registerServerReference } from "@modern-js/runtime/rsc/server";
import { z } from 'zod';

export async function foo() {
  'use server';
  return `foo`;
}
registerServerReference(foo, module.id, "foo");

const b = () => {
  'use server';
  return `baz`;
};
registerServerReference(b, module.id, "baz");
export { b as baz };

export async function bar() {
  return qux();
}

async function qux() {
  'use server';
  return `qux`;
}

registerServerReference(qux, module.id, "qux");

export async function Component() {
  async function handleServerAction(formData) {
    'use server';
    console.log('emit server action', formData);
  }
  return <form action={handleServerAction}></form>;
}
