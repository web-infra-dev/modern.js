import { useState } from 'react';
import { NavItemWithChildren, NavItemWithLink } from 'shared/types';
import { Link } from '../Link';
import Translator from '../../assets/translator.svg';
import Down from '../../assets/down.svg';
import Right from '../../assets/right.svg';

export interface NavMenuGroupItem {
  text?: string | React.ReactElement;
  items: (NavItemWithLink | NavItemWithChildren)[];
  activeValue?: string;
  // When the item is transition, we need to give a react element instead of a string.
  isTranslation?: boolean;
}

function ActiveGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div key={item.link} className="rounded-md" p="y-1.6 l-3">
      <span m="r-1" text="brand">
        {item.text}
      </span>
    </div>
  );
}

function NormalGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div key={item.link} font="medium">
      <Link href={item.link}>
        <div className="rounded-md" hover="bg-mute" p="y-1.6 l-3 r-6">
          <div flex="~">
            <span m="r-1">
              {item.text}
              <Right
                w="11px"
                h="11px"
                text="text-3"
                m="t-1 r-1 l-1"
                className="inline-block align-text-top"
              />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function NavMenuGroup(item: NavMenuGroupItem) {
  const { activeValue, isTranslation, items: groupItems } = item;
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
        {item.items.map(renderLinkItem)}
      </div>
    );
  };
  return (
    <div
      h="14"
      className="relative"
      flex="~ center"
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onMouseEnter={() => setIsOpen(true)}
        flex="~ center"
        align="items-center"
        font="medium"
        text="sm text-1 hover:text-2"
        transition="color duration-200"
        className="nav-menu-group-button"
      >
        <span m="r-1" text="sm" font="medium">
          {isTranslation ? <Translator w="18px" h="18px" /> : item.text}
        </span>
        <Down />
      </button>
      <div
        pos="top-13 right-0"
        m="x-0.8"
        transition="opacity duration-300"
        className="nav-menu-group-content absolute"
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
        }}
      >
        <div
          className="p-3 w-full h-full min-w-128px max-h-100vh rounded-xl whitespace-nowrap bg-white"
          style={{
            boxShadow: 'var(--modern-shadow-3)',
            marginRight: '-1.5rem',
            zIndex: 100,
            border: '1px solid var(--modern-c-divider-light)',
          }}
        >
          {/* The item could be a link or a sub group */}
          {groupItems.map(item => {
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
