import { useI18n, useUrl } from '../../i18n';
import styles from './styles.module.scss';

const isExternalUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

function FooterLink({ to, href, label, ...props }: any) {
  return (
    <a
      className="linkItem"
      target="_blank"
      {...{ href: href || to }}
      {...props}
    >
      {href && isExternalUrl(href) ? <span>{label}</span> : label}
    </a>
  );
}

export default function Footer() {
  const t = useI18n();
  const links = [
    {
      title: t('guide'),
      items: [
        {
          label: t('quickStart'),
          to: useUrl('/guides/get-started/quick-start'),
        },
        {
          label: t('coreConcept'),
          to: useUrl('/guides/concept/entries'),
        },
        {
          label: t('basicFeatures'),
          to: useUrl('/guides/basic-features/routes'),
        },
        {
          label: t('advancedFeatures'),
          to: useUrl('/guides/advanced-features/rspack-start'),
        },
      ],
    },
    {
      title: 'API',
      items: [
        {
          label: t('configuration'),
          to: useUrl('/configure/app/usage'),
        },
        {
          label: t('command'),
          to: useUrl('/apis/app/commands'),
        },
        {
          label: t('runtime'),
          to: useUrl('/apis/app/runtime/core/bootstrap'),
        },
        {
          label: t('conventions'),
          to: useUrl('apis/app/hooks/src/app'),
        },
      ],
    },
    {
      title: t('topic'),
      items: [
        {
          label: t('moduleFederation'),
          to: useUrl('/guides/topic-detail/module-federation/introduce'),
        },
        {
          label: t('pluginSystem'),
          to: useUrl('/plugin/plugin-system'),
        },
      ],
    },
    {
      title: t('help'),
      items: [
        {
          label: t('changelog'),
          to: 'https://github.com/web-infra-dev/modern.js/releases',
        },
        {
          label: 'GitHub Issues',
          to: 'https://github.com/web-infra-dev/modern.js/issues',
        },
        {
          label: t('githubDiscussion'),
          to: 'https://github.com/web-infra-dev/modern.js/discussions',
        },
      ],
    },
  ];

  const Links = links.map(linkItem => (
    <div className={styles.linkWrapper} key={linkItem.title}>
      <div className={styles.linkTitle}>{linkItem.title}</div>
      <ul className={styles.items}>
        {linkItem.items.map((item, key) => (
          <li key={item.to || key} className={styles.link}>
            <FooterLink {...item} />
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    <footer className={styles.footer}>
      <div className={styles.wrapper}>
        <div className={styles.linksWrapper}>{Links}</div>
      </div>
    </footer>
  );
}
