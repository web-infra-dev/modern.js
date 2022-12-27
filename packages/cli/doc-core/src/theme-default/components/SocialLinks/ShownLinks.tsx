import { DefaultTheme } from 'shared/types';
import { LinkContent } from './LinkContent';

interface IShownLinksProps {
  links: DefaultTheme.SocialLink[];
  moreIconVisible?: boolean;
  mouseEnter: () => void;
}

export const ShownLinks = (props: IShownLinksProps) => {
  const { links, moreIconVisible = false, mouseEnter } = props;

  return (
    <>
      <div
        h="100%"
        flex=""
        gap="x-4"
        items-center=""
        transition="color duration-300"
      >
        {links.map(item => (
          <LinkContent
            key={item.icon}
            link={item}
            popperStyle={{ top: '2.5rem' }}
          />
        ))}
      </div>
      {moreIconVisible ? (
        <div
          className="i-carbon-chevron-sort-down ml-1"
          onMouseEnter={mouseEnter}
        ></div>
      ) : null}
    </>
  );
};
