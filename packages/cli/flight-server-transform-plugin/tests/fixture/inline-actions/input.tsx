import { z } from 'zod';

export async function foo() {
  'use server';

  return `foo`;
}

const b = () => {
  'use server';

  return `baz`;
};

export { b as baz };

export async function bar() {
  return qux();
}

async function qux() {
  'use server';
  return `qux`;
}

export default async function increment() {
  'use server';
  return `increment`;
}

export async function Component() {
  async function handleServerAction(formData) {
    'use server';
    console.log('emit server action', formData);
  }
  return <form action={handleServerAction}></form>;
}
