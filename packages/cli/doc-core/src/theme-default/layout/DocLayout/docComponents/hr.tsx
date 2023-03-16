import { ComponentProps } from 'react';

export const Hr = (props: ComponentProps<'hr'>) => {
  return (
    <hr
      {...props}
      className="my-4 border-t bordder-solid border-divider-light"
    />
  );
};
