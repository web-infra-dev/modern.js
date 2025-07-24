import { z } from 'zod';

console.log('zod', z);
export async function foo() {
  'use server';

  return `foo`;
}

export async function bar() {
  return qux();
}

const b = () => {
  'use server';

  return `baz`;
};

export { b as baz };

async function qux() {
  'use server';

  return `qux`;
}

export default function () {
  'use server';

  return `default`;
}
