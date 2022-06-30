---
'@modern-js/module-tools': minor
---

- use speedy as a bundler to support bundle, and support dts and css bundle.
- design `buildConfig` to support build for different scene, and design `buildPreset` to cover most of scenes.
- add `tools.speedy` to receive custom speedy config.
- remove child process to solving problems with serialisation parameters.
- add more test cases, improve quality construction.
- design a new log about build process
