import { useState } from 'react';
import { NavItemWithChildren, NavItemWithLink } from 'shared/types';
import { Link } from '../Link';
import Translator from '../../assets/translator.svg';
import Down from '../../assets/down.svg';
import { Tag } from '../Tag';

export interface NavMenuGroupItem {
  text?: string | React.ReactElement;
  items: (NavItemWithLink | NavItemWithChildren)[];
  tag?: string;
  activeValue?: string;
  // When the item is transition, we need to give a react element instead of a string.
  isTranslation?: boolean;
}

function ActiveGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div
      key={item.link}
      className="rounded-2xl my-1 flex"
      style={{
        padding: '0.4rem 1.5rem 0.4rem 0.75rem',
      }}
    >
      {item.tag && <Tag tag={item.tag} />}
      <span className="text-brand">{item.text}</span>
    </div>
  );
}

function NormalGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div key={item.link} className="font-medium my-1">
      <Link href={item.link}>
        <div
          className="rounded-2xl hover:bg-mute"
          style={{
            padding: '0.4rem 1.5rem 0.4rem 0.75rem',
          }}
        >
          <div className="flex">
            {item.tag && <Tag tag={item.tag} />}
            <span>{item.text}</span>
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
        {(item.items as NavItemWithLink[]).map(renderLinkItem)}
      </div>
    );
  };
  return (
    <div
      className="relative flex-center h-14"
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onMouseEnter={() => setIsOpen(true)}
        className="nav-menu-group-button flex-center items-center font-medium text-sm text-text-1 hover:text-text-2 transition-colors duration-200"
      >
        <span
          className="text-sm font-medium flex"
          style={{
            marginRight: '2px',
          }}
        >
          <Tag tag={item.tag} />
          {isTranslation ? (
            <Translator
              style={{
                with: '18px',
                height: '18px',
              }}
            />
          ) : (
            item.text
          )}
        </span>
        <Down />
      </button>
      <div
        className="nav-menu-group-content absolute mx-0.8 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          right: 0,
          top: '52px',
        }}
      >
        <div
          className="p-3 pr-2 w-full h-full max-h-100vh whitespace-nowrap"
          style={{
            boxShadow: 'var(--modern-shadow-3)',
            zIndex: 100,
            border: '1px solid var(--modern-c-divider-light)',
            borderRadius: '2rem',
            background: 'var(--modern-c-bg)',
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
