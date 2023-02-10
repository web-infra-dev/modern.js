import { useState } from 'react';
import { SocialLink } from 'shared/types';
import { ShownLinks } from './ShownLinks';
import { HiddenLinks } from './HiddenLinks';
import styles from './index.module.scss';

export const SocialLinks = ({ socialLinks }: { socialLinks: SocialLink[] }) => {
  const moreThanThree = socialLinks.length > 3;

  const shownLinks: SocialLink[] = [];
  const hiddenLinks: SocialLink[] = [];

  socialLinks.forEach((item, index) => {
    if (index < 3) {
      shownLinks.push(item);
    } else {
      hiddenLinks.push(item);
    }
  });

  const [moreLinksVisible, setMoreLinksVisible] = useState(false);

  return (
    <div
      className={`social-links ${styles.menuItem} flex-center`}
      pos="relative"
      onMouseLeave={() => setMoreLinksVisible(false)}
    >
      <ShownLinks
        links={shownLinks}
        moreIconVisible={moreThanThree}
        mouseEnter={() => setMoreLinksVisible(true)}
      />
      {moreLinksVisible ? <HiddenLinks links={hiddenLinks} /> : null}
    </div>
  );
};
