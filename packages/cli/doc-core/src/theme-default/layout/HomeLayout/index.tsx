import { HomeFooter } from '@theme';
import { HomeHero } from '../../components/HomeHero';
import { HomeFeature } from '../../components/HomeFeatures';
import './index.css';
import { usePageData } from '@/runtime';

export interface HomeLayoutProps {
  beforeHero?: React.ReactNode;
  afterHero?: React.ReactNode;
  beforeFeatures?: React.ReactNode;
  afterFeatures?: React.ReactNode;
}

export function HomeLayout(props: HomeLayoutProps) {
  const { beforeHero, afterHero, beforeFeatures, afterFeatures } = props;
  const {
    page: { frontmatter },
  } = usePageData();
  return (
    <div
      className="relative"
      style={{
        minHeight: 'calc(100vh - var(--modern-nav-height))',
        paddingBottom: '80px',
      }}
    >
      <div className="mt-14 pb-12">
        {beforeHero}
        <HomeHero frontmatter={frontmatter} />
        {afterHero}
        {beforeFeatures}
        <HomeFeature frontmatter={frontmatter} />
        {afterFeatures}
      </div>
      <HomeFooter />
    </div>
  );
}
