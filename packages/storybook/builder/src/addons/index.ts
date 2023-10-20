declare const module: any;

if (module?.hot?.decline) {
  module.hot.decline();
}

// make it work with --isolatedModules
export default {};
