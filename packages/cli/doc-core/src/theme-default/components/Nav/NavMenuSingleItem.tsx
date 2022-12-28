import { NavItemWithLink } from 'shared/types';
import { Link } from '../Link';
import { normalizeHref } from '@/runtime';

interface Props {
  pathname: string;
}

export function NavMenuSingleItem(item: NavItemWithLink & Props) {
  const { pathname } = item;
  const isActive = new RegExp(item.activeMatch || item.link).test(pathname);
  return (
    <div
      key={item.text}
      text="sm"
      font="medium"
      m="x-3"
      className={`${isActive ? 'text-brand' : ''}`}
    >
      <Link href={normalizeHref(item.link)}>{item.text}</Link>
    </div>
  );
}
