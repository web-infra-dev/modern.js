import { useUnmount } from 'react-use';
import styles from './loading.module.scss';
import { useGlobals } from '@/entries/client/globals';
import { Loading } from '@/components/Loading';

const GlobalLoading = () => {
  const { mountPoint } = useGlobals();
  useUnmount(async () => {
    mountPoint.remote.onFinishRender();
  });

  return <Loading className={styles.loading} />;
};

export default GlobalLoading;
