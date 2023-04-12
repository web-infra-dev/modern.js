import { ComponentProps } from 'react';

export const Table = (props: ComponentProps<'table'>) => {
  return (
    <table
      {...props}
      className="table border-collapse text-base my-5 overflow-x-auto leading-7 border-gray-light-2"
    />
  );
};

export const Tr = (props: ComponentProps<'tr'>) => {
  return (
    <tr
      {...props}
      className="border border-solid transition-colors duration-500 even:bg-soft border-gray-light-2"
    />
  );
};

export const Td = (props: ComponentProps<'td'>) => {
  return (
    <td
      {...props}
      className="border border-solid  px-4 py-2 border-gray-light-2"
    />
  );
};

export const Th = (props: ComponentProps<'th'>) => {
  return (
    <th
      {...props}
      className="border border-solid px-4 py-2 text-text-1 text-base font-semibold border-gray-light-2"
    />
  );
};
