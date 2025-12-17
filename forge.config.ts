import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'path';

import { mainConfig } from './config/webpack.main.config';
import { rendererConfig } from './config/webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './out/icons/icon',
    appBundleId: 'com.awesomedog.maxlaunchpad',
    name: 'MaxLaunchpad',
    extraResource: [
      './out/icons/icon.png',
      './out/icons/iconTemplate.png',
      './resources/config-templates',
    ],
  },
  rebuildConfig: {},
  hooks: {
    generateAssets: async () => {
      const generateIconsPath = path.join(__dirname, 'scripts', 'generate-icons.js');
      try {
        require(generateIconsPath);
      } catch (error) {
        console.error('Icon generation failed:', (error as Error).message);
      }
    },
  },
  makers: [
    new MakerSquirrel({
      name: 'MaxLaunchpad',
      setupIcon: './out/icons/icon.ico',
    }),
    new MakerDMG({
      name: 'MaxLaunchpad',
      icon: './out/icons/icon.icns',
    }, ['darwin']),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        name: 'MaxLaunchpad',
        productName: 'MaxLaunchpad',
        icon: './out/icons/icon.png',
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'self' ws://localhost:* ws://0.0.0.0:*;",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload/index.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
