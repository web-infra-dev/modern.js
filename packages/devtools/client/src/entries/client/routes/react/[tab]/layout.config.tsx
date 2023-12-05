import { SelectLink } from '@/components/SelectLink';

export const handle = {
  breadcrumb: [
    { title: 'React' },
    {
      title: (
        <SelectLink
          items={[
            { to: '/react/components', title: 'Components' },
            { to: '/react/profiler', title: 'Profiler' },
          ]}
        />
      ),
    },
  ],
};
