import { NavItemWithLink } from 'shared/types';
import { Link } from '../Link';
import { Tag } from '../Tag';
import styles from './index.module.scss';
import { normalizeHref } from '@/runtime';
import { withoutBase } from '@/shared/utils';

interface Props {
  pathname: string;
  langs: string[];
  base: string;
}

export function NavMenuSingleItem(item: NavItemWithLink & Props) {
  const { pathname, base } = item;
  const isActive = new RegExp(item.activeMatch || item.link).test(
    withoutBase(pathname, base),
  );

  return (
    <Link href={normalizeHref(item.link)}>
      <div
        key={item.text}
        className={`${styles.singleItem} ${
          isActive ? styles.activeItem : ''
        } text-sm font-medium mx-1.5 px-3 py-2 flex`}
      >
        <Tag tag={item.tag} />
        {item.text}
      </div>
    </Link>
  );
}
