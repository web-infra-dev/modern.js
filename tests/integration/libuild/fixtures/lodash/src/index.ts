import _, { add } from 'lodash';
import _es, { add as addEs } from 'lodash-es';

add(1, 2);
_.map([1, 2, 3], () => {});

addEs(1, 2);
_es.map([1, 2, 3], () => {});
