import { SocialLink } from 'shared/types';
import { LinkContent } from './LinkContent';

interface IHiddenLinksProps {
  links: SocialLink[];
}

export const HiddenLinks = (props: IHiddenLinksProps) => {
  const { links } = props;

  return (
    <div
      pos="absolute top-13 right-0"
      z="1"
      p="3"
      w="32"
      border="rounded-xl"
      bg="white"
      style={{
        boxShadow: 'var(--modern-shadow-3)',
        marginRight: '-2px',
        border: '1px solid var(--modern-c-divider-light)',
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
