import { Location } from '@modern-js/runtime/router';
import _ from 'lodash';
import { $$globals } from '@/entries/client/globals';
import { use } from '@/utils';

export const handle = {
  breadcrumb(params: any) {
    const { pathname } = params.location as Location;
    const name = pathname.match(/^\/external\/(\w+)/)?.[1];
    const { tabs } = use($$globals);
    let title: string;
    const tab = _.find(tabs, { name });
    if (tab) {
      ({ title } = tab);
    } else if (name) {
      title = _.startCase(name);
    } else {
      title = 'External';
    }
    return { title, pathname };
  },
};
