import { SelectLink } from '@/client/components/SelectLink';

export const handle = {
  breadcrumb: [
    { title: 'Context' },
    {
      title: (
        <SelectLink
          items={[
            { to: '/context/builder', title: 'Builder' },
            { to: '/context/framework', title: 'Framework' },
          ]}
        />
      ),
    },
  ],
};
