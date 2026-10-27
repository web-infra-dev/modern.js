import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { port, origin, shared } from '../ports';
const version = process.env.MF_LAB_VERSION === 'v2' ? 'v2' : 'v1';
const key = version === 'v2' ? 'libraryV2' : 'library';
export default defineConfig({
  performance: { buildCache: false },
  lib: [
    {
      format: 'mf',
      dts: false,
      output: { distPath: { root: version === 'v2' ? 'dist/v2' : 'dist/v1' } },
    },
  ],
  server: {
    port: port(key, version === 'v2' ? 4305 : 4303),
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  output: { assetPrefix: `${origin(key, version === 'v2' ? 4305 : 4303)}/` },
  tools: {
    rspack: {
      output: {
        uniqueName: `mf-lab-library-${version}`,
        chunkLoadingGlobal: `mf_lab_library_${version}`,
      },
    },
  },
  source: {
    define: {
      'process.env.MF_LAB_API': JSON.stringify(origin('api', 4306)),
      'process.env.MF_LAB_VERSION': JSON.stringify(version),
    },
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation(
      {
        name: 'lab_library',
        dts: false,
        exposes: {
          './WeatherRelease': './src/WeatherRelease.tsx',
          './WeatherHourly': './src/WeatherHourly.tsx',
          './WeatherWind': './src/WeatherWind.tsx',
          './Forecast': './src/Forecast.tsx',
          './NoData': './src/NoData.tsx',
          './Reload': './src/Reload.tsx',
        },
        shared,
      },
      { target: 'dual' },
    ),
  ],
});
