import { NavItemWithChildren, NavItemWithLink } from 'shared/types';
import { useState } from 'react';
import Down from '../../assets/down.svg';
import Right from '../../assets/right.svg';
import { Link } from '../Link';
import styles from './index.module.scss';

export interface NavScreenMenuGroupItem {
  text?: string | React.ReactElement;
  items: (NavItemWithLink | NavItemWithChildren)[];
  activeValue?: string;
}

function ActiveGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div className="p-1">
      <span m="r-1" text="brand">
        {item.text}
      </span>
    </div>
  );
}

function NormalGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div className="py-1" font="medium">
      <Link href={item.link}>
        <div>
          <div flex="~">
            <span m="r-1">{item.text}</span>
            <Right w="11px" h="11px" text="text-3" m="t-1 r-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export function NavScreenMenuGroup(item: NavScreenMenuGroupItem) {
  const { activeValue } = item;
  const [isOpen, setIsOpen] = useState(false);
  const renderLinkItem = (item: NavItemWithLink) => {
    if (activeValue === item.text) {
      return <ActiveGroupItem key={item.link} item={item} />;
    }
    return <NormalGroupItem key={item.link} item={item} />;
  };
  const renderGroup = (item: NavItemWithChildren) => {
    return (
      <div>
        <p className="font-bold text-gray-400 my-1 not:first:border">
          {item.text}
        </p>
        {(item.items as NavItemWithLink[]).map(renderLinkItem)}
      </div>
    );
  };
  return (
    <div
      pos="relative"
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
          {/* The item could be a link or a sub group */}
          {item.items.map(item => {
            return (
              <div key={item.text}>
                {'link' in item ? renderLinkItem(item) : renderGroup(item)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
