import { ComponentProps } from 'react';

export const Table = (props: ComponentProps<'table'>) => {
  return (
    <table
      {...props}
      className="block border-collapse text-base my-5 overflow-x-auto leading-7"
    />
  );
};

export const Tr = (props: ComponentProps<'tr'>) => {
  return (
    <tr
      {...props}
      className="border border-solid transition-colors duration-500 even:bg-soft"
    />
  );
};

export const Td = (props: ComponentProps<'td'>) => {
  return <td {...props} className="border border-solid  px-4 py-2" />;
};

export const Th = (props: ComponentProps<'th'>) => {
  return (
    <th
      {...props}
      className="border border-solid dark:border-black px-4 py-2 text-base font-semibold"
    />
  );
};
