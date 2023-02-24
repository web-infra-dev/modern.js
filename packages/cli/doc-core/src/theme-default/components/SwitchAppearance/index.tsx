import { Switch } from '../Switch';
import SunSvg from '../../assets/sun.svg';
import MoonSvg from '../../assets/moon.svg';
import styles from './index.module.scss';

export function SwitchAppearance({ onClick }: { onClick?: () => void }) {
  return (
    <Switch onClick={onClick}>
      <SunSvg className={styles.sun} />
      <MoonSvg className={styles.moon} />
    </Switch>
  );
}
