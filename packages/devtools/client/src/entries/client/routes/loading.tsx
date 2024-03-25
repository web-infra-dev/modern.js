import { useUnmount } from 'react-use';
import { $mountPoint } from './state';
import { Loading } from '@/components/Loading';

const Foo = () => {
  useUnmount(async () => {
    const mountPoint = await $mountPoint;
    mountPoint.remote.onFinishRender();
  });

  return (
    <Loading
      width="100%"
      style={{ height: 'calc(100vh - var(--breadcrumb-height))' }}
    />
  );
};

export default Foo;
