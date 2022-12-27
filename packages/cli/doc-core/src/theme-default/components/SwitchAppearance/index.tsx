import { Switch } from '../Switch';
import SunSvg from '../../assets/sun.svg';
import MoonSvg from '../../assets/moon.svg';
import { getToggle } from '../../logic/useAppearance';
import styles from './index.module.scss';

export function SwitchAppearance() {
  const toggle = getToggle();
  return (
    <Switch onClick={toggle}>
      <SunSvg className={styles.sun} />
      <MoonSvg className={styles.moon} />
    </Switch>
  );
}
