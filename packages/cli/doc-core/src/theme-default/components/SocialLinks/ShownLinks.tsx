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
      <div className="flex-center h-full gap-x-4 transition-colors duration-300 md:mr-2">
        {links.map((item, index) => (
          <LinkContent
            key={index}
            link={item}
            popperStyle={{ top: '2.5rem' }}
          />
        ))}
      </div>
      {moreIconVisible ? (
        <div className="md:ml-1" onMouseEnter={mouseEnter}>
          <ArrowDown />
        </div>
      ) : null}
    </>
  );
};
