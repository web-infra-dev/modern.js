import { ComponentProps } from 'react';

export const Ol = (props: ComponentProps<'ol'>) => {
  return <ol {...props} className="list-decimal pl-5 my-4 leading-7" />;
};

export const Ul = (props: ComponentProps<'ul'>) => {
  return <ul {...props} className="list-disc pl-5 my-4 leading-7" />;
};

export const Li = (props: ComponentProps<'li'>) => {
  return <li {...props} className="[&:not(:first-child)]:mt-2" />;
};
