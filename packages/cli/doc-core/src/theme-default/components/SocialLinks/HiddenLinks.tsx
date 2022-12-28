import { SocialLink } from 'shared/types';
import { LinkContent } from './LinkContent';

interface IHiddenLinksProps {
  links: SocialLink[];
}

export const HiddenLinks = (props: IHiddenLinksProps) => {
  const { links } = props;

  return (
    <div
      absolute=""
      pos="top-13 right-0"
      z="1"
      p="3"
      w="32"
      border-1=""
      rounded="xl"
      bg="bg-default"
      style={{
        boxShadow: 'var(--island-shadow-3)',
        marginRight: '-2px',
      }}
      flex="~ wrap"
      gap="4"
    >
      {links.map(item => (
        <LinkContent
          key={item.content}
          link={item}
          popperStyle={{ top: '1.25rem' }}
        />
      ))}
    </div>
  );
};
