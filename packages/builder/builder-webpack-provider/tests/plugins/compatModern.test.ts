// import { expect, describe, it } from 'vitest';
// import { PluginCompatModern } from '@/plugins/compatModern';
// import { PluginFallback } from '@/plugins/fallback';
// import { PluginManifest } from '@/plugins/manifest';
// import { PluginModuleScopes } from '@/plugins/moduleScopes';
// import { PluginMoment } from '@/plugins/moment';
// import { PluginOutput } from '@/plugins/output';
// import { PluginResolve } from '@/plugins/resolve';
// import { createStubBuilder } from '@/stub';

// describe('plugins/compatModern', () => {
//   // skipped because this case time out in CI env
//   it.skip('should apply compatible webpack configs correctly', async () => {
//     const builder = await createStubBuilder({
//       plugins: [
//         PluginOutput(),
//         PluginResolve(),
//         PluginMoment(),
//         PluginManifest(),
//         PluginCompatModern(),
//         PluginModuleScopes(),
//         PluginFallback(),
//       ],
//     });

//     const config = await builder.unwrapWebpackConfig();
//     expect(config).toMatchSnapshot();
//   });

//   it('should apply name and extensions for node target correctly', async () => {
//     const builder = await createStubBuilder({
//       plugins: [PluginCompatModern()],
//       target: ['node'],
//     });

//     const config = await builder.unwrapWebpackConfig();
//     expect(config.name).toEqual('server');
//     expect(config.resolve?.extensions).toEqual([
//       '.node.tsx',
//       '.node.ts',
//       '.node.jsx',
//       '.node.js',
//     ]);
//   });

//   it('should apply name for modern target correctly', async () => {
//     const builder = await createStubBuilder({
//       plugins: [PluginCompatModern()],
//       target: ['modern-web'],
//     });

//     const config = await builder.unwrapWebpackConfig();
//     expect(config.name).toEqual('modern');
//   });
// });
