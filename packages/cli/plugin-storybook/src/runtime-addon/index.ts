declare const module: any;

if (module?.hot?.decline) {
  module.hot.decline();
}

// make it work with --isolatedModules
// eslint-disable-next-line import/no-anonymous-default-export
export default {};
