const getEditorStaticPath = (isTestEnv = false) =>
  isTestEnv
    ? 'http://test-fes-sso.bytedance.net'
    : 'http://test-fes-sso.bytedance.net';

export default getEditorStaticPath;
