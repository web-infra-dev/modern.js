import { Loading } from '@/components/Loading';

export default () => {
  return (
    <Loading
      width="100%"
      style={{ height: 'calc(100vh - var(--breadcrumb-height))' }}
    />
  );
};
