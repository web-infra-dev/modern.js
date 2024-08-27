import { Loading } from '@/components/Loading';
import { useGlobals } from '@/entries/client/globals';
import { useUnmount } from 'react-use';
import styles from './loading.module.scss';

const GlobalLoading = () => {
  const { mountPoint } = useGlobals();
  useUnmount(async () => {
    mountPoint.remote.onFinishRender();
  });

  return <Loading className={styles.loading} />;
};

export default GlobalLoading;
