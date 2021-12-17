const comp = (meta: Record<string, any>, name: string, version: string) => ({
  category: '本地模块（LOCAL)',
  coverUrl:
    meta.coverUrl ||
    'https://lf3-hscdn-tos.pstatp.com/obj/developer-baas/baas/ttzu9f/74fe7d24f27d835c_1606141940574.png',
  createdAt: '2020-11-23T14:32:21.045Z',
  desc: meta.desc || '本地模块（LOCAL)',
  groups: ['@byted-blocks/local-groups'],
  iconUrl: meta.iconUrl || '',
  isBlock: true,
  key: name,
  name,
  presets: [],
  readme: null,
  development: true,
  supportNoCode: true,
  title: meta.title || '本地模块（LOCAL)',
  version,
  type: 'BLOCK',
  packageType: 'BLOCK',
  versions: [],
});

const compGroupComp = (
  meta: Record<string, any>,
  compName: string,
  name: string,
  version: string,
) => {
  const _comp: Record<string, any> = comp(meta, name, version);
  _comp.compName = compName;
  _comp.desc = meta.desc;
  _comp.coverUrl = meta.coverUrl;
  _comp.iconUrl = meta.iconUrl;

  return _comp;
};

export const comps = (
  meta: Record<string, any>,
  name: string,
  version: string,
) => {
  const isCompGroup = Boolean(meta.contains);
  return isCompGroup
    ? Object.keys(meta.contains).map(key =>
        compGroupComp(meta.contains[key], key, name, version),
      )
    : [comp(meta, name, version)];
};

export const category = (
  meta: Record<string, any>,
  name: string,
  version: string,
) => {
  const data = {
    bnpmDownloads: 0,
    categoryName: '本地模块（LOCAL）',
    comps: comps(meta, name, version),
    createdAt: '2020-08-25T12:20:34.524Z',
    desc: '本地模块（LOCAL)',
    firstVersion: '1.0.12',
    firstVersionCreatedAt: '2020-05-28T07:37:31.760Z',
    hasBlock: true,
    iconUrl:
      'https://sf1-hscdn-tos.pstatp.com/obj/developer-baas/baas/ttzu9f/d59e42178d0d0ca9_1598358033949.png',
    latestVersion: '1.0.40',
    latestVersionCreatedAt: '2020-08-25T12:20:34.524Z',
    supportNoCode: true,
    title: '本地模块（LOCAL)',
    type: meta.contains ? 'COMP_GROUP' : 'GROUP',
    packageType: meta.contains ? 'COMP_GROUP' : 'GROUP',
    _valid: true,
  };

  return data;
};

export const model = (
  meta: Record<string, any>,
  name: string,
  version: string,
) => ({
  category: '本地模块（LOCAL)',
  coverUrl:
    meta.coverUrl ||
    'https://lf3-hscdn-tos.pstatp.com/obj/developer-baas/baas/ttzu9f/74fe7d24f27d835c_1606141940574.png',
  createdAt: '2020-11-23T14:32:21.045Z',
  desc: meta.desc || '本地模块（LOCAL)',
  iconUrl: '',
  isBlock: false,
  key: name,
  name,
  packageType: 'MODEL',
  presets: [],
  readme: null,
  development: true,
  supportNoCode: true,
  title: meta.title || '本地模块（LOCAL)',
  type: 'MODEL',
  version,
  versions: [],
});
