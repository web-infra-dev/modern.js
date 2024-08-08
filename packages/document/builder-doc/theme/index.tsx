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

export * from 'rspress/theme';

export default {
  ...Theme,
  Layout,
};
