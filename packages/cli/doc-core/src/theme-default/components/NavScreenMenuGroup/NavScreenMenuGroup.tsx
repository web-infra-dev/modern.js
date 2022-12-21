import { DefaultTheme } from 'shared/types';
import { useState } from 'react';
import Down from '../../assets/down.svg';
import Right from '../../assets/right.svg';
import { Link } from '../Link';
import styles from './index.module.scss';

export interface NavScreenMenuGroupItem {
  text?: string | React.ReactElement;
  items: DefaultTheme.NavItemWithLink[];
  activeIndex?: number;
}

export function NavScreenMenuGroup(item: NavScreenMenuGroupItem) {
  const { activeIndex } = item;
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      relative=""
      className={`${isOpen ? styles.open : ''} ${styles.navScreenMenuGroup}`}
    >
      <button
        className={styles.button}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <span className={styles.buttonSpan}>{item.text}</span>
        <Down className={`${isOpen ? styles.open : ''} ${styles.down} `} />
      </button>
      <div>
        <div className={styles.items}>
          {item.items.map((child, index) => {
            if (index === activeIndex) {
              return (
                <div className="pa-1" key={child.link}>
                  <span mr="1" text="brand">
                    {child.text}
                  </span>
                </div>
              );
            } else {
              return (
                <div className="pa-1" key={child.link} font="medium">
                  <Link href={child.link}>
                    <div>
                      <div flex="">
                        <span mr="1">{child.text}</span>
                        <Right w="11px" h="11px" text="text-3" m="t-1 r-1" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
