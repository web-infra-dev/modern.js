import { NotFoundLayout } from './layout/NotFountLayout';
import { Layout } from './layout/Layout';
import { HomeLayout } from './layout/HomeLayout';
import { setup } from './logic';
import { Nav } from './components/Nav';
import { Search } from './components/Search';
import { Tab, Tabs } from './components/Tabs';
import { Button } from './components/Button';
import { Link } from './components/Link';
import { HomeFooter } from './components/HomeFooter';

export { Nav, Search, Tab, Tabs, Button, Link, HomeFooter };

export default {
  Layout,
  NotFoundLayout,
  HomeLayout,
  setup,
};

export { getCustomMDXComponent } from './layout/DocLayout/docComponents';

export * from './logic';
