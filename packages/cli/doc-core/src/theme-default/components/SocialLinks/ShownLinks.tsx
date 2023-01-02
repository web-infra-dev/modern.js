import { SocialLink } from 'shared/types';
import ArrowDown from '../../assets/arrow-down.svg';
import { LinkContent } from './LinkContent';

interface IShownLinksProps {
  links: SocialLink[];
  moreIconVisible?: boolean;
  mouseEnter: () => void;
}

export const ShownLinks = (props: IShownLinksProps) => {
  const { links, moreIconVisible = false, mouseEnter } = props;

  return (
    <>
      <div
        h="full"
        flex="~"
        gap="x-4"
        align-items-center="~"
        transition="color duration-300"
      >
        {links.map((item, index) => (
          <LinkContent
            key={index}
            link={item}
            popperStyle={{ top: '2.5rem' }}
          />
        ))}
      </div>
      {moreIconVisible ? (
        <div className="ml-1" onMouseEnter={mouseEnter}>
          <ArrowDown />
        </div>
      ) : null}
    </>
  );
};
