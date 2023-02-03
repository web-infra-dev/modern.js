import { NavItemWithLink } from 'shared/types';
import { Link } from '../Link';
import { normalizeHref } from '@/runtime';
import { withoutBase, withoutLang } from '@/shared/utils';

interface Props {
  pathname: string;
  langs: string[];
  base: string;
}

export function NavMenuSingleItem(item: NavItemWithLink & Props) {
  const { pathname, base, langs } = item;
  const isActive = new RegExp(item.activeMatch || item.link).test(
    withoutLang(withoutBase(pathname, base), langs),
  );
  return (
    <div
      key={item.text}
      text="sm"
      font="medium"
      m="x-3"
      className={`${isActive ? 'text-brand-dark' : ''}`}
    >
      <Link href={normalizeHref(item.link)}>{item.text}</Link>
    </div>
  );
}
