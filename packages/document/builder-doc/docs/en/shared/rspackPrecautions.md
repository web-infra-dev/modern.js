## Precautions

Before using Rspack, please be aware that Rspack is currently in the rapid iteration phase. Therefore, you need to be aware of the following:

- The API and configuration items of Rspack are not completely stable yet, so non-major versions may introduce some incompatible changes.
- Rspack currently relies on SWC for code transformation and compression. Due to the lower maturity of SWC compared to Babel and Terser, you may encounter bugs of SWC in edge cases.
- Rspack is compatible with most plugins and loaders in the webpack ecosystem, but there are still some plugins and loaders that cannot be used temporarily.

Rspack is actively working to resolve the above issues and plans to address them in future updates. We recommend evaluating your project requirements and risk tolerance before deciding whether to use Rspack. If your project requires high stability and high performance, you should choose the more mature tool, Webpack. If you are willing to try new tools and contribute to their development, we encourage you to use Rspack and provide feedback and bug reports to help improve its stability and functionality.
