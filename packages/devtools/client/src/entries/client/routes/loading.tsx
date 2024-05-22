import { useUnmount } from 'react-use';
import { $mountPoint } from './state';
import styles from './loading.module.scss';
import { Loading } from '@/components/Loading';

const GlobalLoading = () => {
  useUnmount(async () => {
    const mountPoint = await $mountPoint;
    mountPoint.remote.onFinishRender();
  });

  return <Loading className={styles.loading} />;
};

export default GlobalLoading;
