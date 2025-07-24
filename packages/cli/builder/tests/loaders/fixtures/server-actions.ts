'use server';
export async function foo() {
  return 'foo';
}

export const bar = async () => 'bar';

const baz = async () => 'baz';

export { baz as b };

export const qux = 'qux';

async function qoo() {
  return 'qoo';
}

export default qoo;
