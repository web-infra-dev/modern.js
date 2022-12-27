import styles from './index.module.scss';

interface Props {
  closeSidebar: () => void;
  isOpen: boolean;
}

export function BackDrop(props: Props) {
  const { closeSidebar, isOpen } = props;
  return isOpen ? (
    <div onClick={closeSidebar} className={styles.backDrop} />
  ) : null;
}
