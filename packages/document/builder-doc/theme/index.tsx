import Theme from 'rspress/theme';
import { NoSSR } from 'rspress/runtime';
import { Announcement } from './components/Announcement';

const Layout = () => (
  <Theme.Layout
    beforeNav={
      <NoSSR>
        <Announcement />
      </NoSSR>
    }
  />
);

// eslint-disable-next-line import/export
export * from 'rspress/theme';

export default {
  ...Theme,
  Layout,
};
