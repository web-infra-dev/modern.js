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
    <div
      key={item.link}
      className="rounded-md"
      style={{
        padding: '0.4rem 1.5rem 0.4rem 0.75rem',
      }}
    >
      <span className="mr-1 text-brand">{item.text}</span>
    </div>
  );
}

function NormalGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div key={item.link} className="font-medium">
      <Link href={item.link}>
        <div
          className="rounded-md hover:bg-mute"
          style={{
            padding: '0.4rem 1.5rem 0.4rem 0.75rem',
          }}
        >
          <div className="flex">
            <span className="mr-1">
              {item.text}
              <Right
                className="inline-block align-text-top mt-1 mr-1 ml-1 text-text-3"
                style={{
                  width: '11px',
                  height: '11px',
                }}
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
        <span className="mr-1 text-sm font-medium">
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
        className="nav-menu-group-content absolute mx-0.8 transition-opacity duration-300 c"
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          right: 0,
          top: '52px',
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
