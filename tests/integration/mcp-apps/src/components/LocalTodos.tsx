import type { ComponentProps } from 'react';
import Todos from './Todos';
import { label } from './local-label';

export default function LocalTodos(props: ComponentProps<typeof Todos>) {
  return (
    <>
      <p>{label}</p>
      <Todos {...props} />
    </>
  );
}
