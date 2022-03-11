import React from 'react';
import Link from '@docusaurus/Link';
import Masonry from 'react-masonry-component';

import './index.css';

interface ILink {
  href: string;
  label: string;
}

interface IOverviewNavCard {
  label: string;
  description: string;
  items: ILink[];
  type: string;
  href?: string;
}

const OverviewNavCard: React.FC<IOverviewNavCard> = ({
  label,
  description,
  type,
  items,
  href: categoryHref,
}) => (
  <div className="nav-card-item">
    <h4>{label}</h4>
    <p>{description}</p>
    <ul>
      {items?.map(item => {
        let { href } = item;
        if (item.type === 'category') {
          const child = item?.items[0];
          if (child.type === 'category') {
            href = child?.items[0].href;
          } else {
            href = item?.items[0].href;
          }
        }
        return (
          <li key={item.label}>
            <Link to={href}>{item.label}</Link>
          </li>
        );
      })}
      {!items && type === 'link' && (
        <li key={label}>
          <Link to={categoryHref}>{label}</Link>
        </li>
      )}
    </ul>
  </div>
);

const OverviewNav = ({ cards, ret }) => (
  <div>
    {ret?.()}
    <Masonry
      className={'nav-container-block'} // default ''
      disableImagesLoaded={false} // default false
      updateOnEachImageLoad={false} // default false and works only if disableImagesLoaded is false
    >
      {cards?.map(card => {
        if (card.label === '概览') {
          return null;
        } else {
          return <OverviewNavCard {...card} key={card.label} />;
        }
      })}
    </Masonry>
  </div>
);

export default OverviewNav;
