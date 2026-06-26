// 带 magic comment 的真实 dynamic import / require —— 必须被识别并迁移
export const loadBff = () =>
  import(/* webpackChunkName: "bff" */ '@modern-js/runtime/bff');

export const loadServer = () =>
  require(/* server runtime */ '@modern-js/runtime/server');
