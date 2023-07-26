## Precautions

Before using Rspack, please be aware that Rspack is still an early stage project and is currently in a rapid iteration phase. Therefore, you need to be aware of the following:

- The API and configuration options of Rspack are still unstable, and the support for Rspack in Modern.js is experimental. Therefore, incompatible updates may be introduced in non-major releases in the future.
- Rspack does not currently provide complete optimization capabilities like tree shaking, bundle splitting, and scope hoisting, which are available in webpack. We will continue to enhance these optimization capabilities in Rspack from June to December. Therefore, when migrating to Rspack, you may notice a certain level of increase in the bundle size compared to webpack.
- Rspack currently relies on SWC for code compilation and compression. Due to the lower maturity of SWC compared to Babel and Terser, you may encounter SWC bugs.
- Rspack is compatible with most plugins and loaders in the webpack ecosystem, but there are still some plugins and loaders that cannot be used temporarily.

Rspack is actively working to improve the above issues and plans to address them in future releases. We recommend that you evaluate your project requirements and risk tolerance before deciding whether to use Rspack. If your project requires high stability and performance, you should choose the more mature webpack. If you are willing to try new tools and contribute to their development, we welcome you to use Rspack and provide feedback and bug reports to help improve its stability and functionality.
