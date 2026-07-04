import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'fs';
import path from 'path';

import { mainConfig } from './config/webpack.main.config';
import { rendererConfig } from './config/webpack.renderer.config';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type IconAsset = {
  iconPath: string;
  type: 'png' | 'ico' | 'icns';
  width?: number;
  height?: number;
};

function assertPngDimensions(buffer: Buffer, asset: IconAsset): void {
  if (buffer.length < 24 || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(`Icon generation failed: invalid PNG signature for ${asset.iconPath}`);
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== asset.width || height !== asset.height) {
    throw new Error(
      `Icon generation failed: expected ${asset.width}x${asset.height} PNG for ${asset.iconPath}, got ${width}x${height}`,
    );
  }
}

function assertIcoHeader(buffer: Buffer, asset: IconAsset): void {
  const isIco =
    buffer.length >= 6 &&
    buffer.readUInt16LE(0) === 0 &&
    buffer.readUInt16LE(2) === 1 &&
    buffer.readUInt16LE(4) > 0;
  if (!isIco) {
    throw new Error(`Icon generation failed: invalid ICO header for ${asset.iconPath}`);
  }
}

function assertIcnsHeader(buffer: Buffer, asset: IconAsset): void {
  if (buffer.length < 8 || buffer.subarray(0, 4).toString('ascii') !== 'icns') {
    throw new Error(`Icon generation failed: invalid ICNS header for ${asset.iconPath}`);
  }
}

function validateIconAsset(asset: IconAsset): void {
  const resolvedIconPath = path.resolve(__dirname, asset.iconPath);
  if (!fs.existsSync(resolvedIconPath)) {
    throw new Error(`Icon generation failed: missing ${asset.iconPath}`);
  }

  const buffer = fs.readFileSync(resolvedIconPath);
  if (buffer.length === 0) {
    throw new Error(`Icon generation failed: empty ${asset.iconPath}`);
  }

  if (asset.type === 'png') {
    assertPngDimensions(buffer, asset);
  } else if (asset.type === 'ico') {
    assertIcoHeader(buffer, asset);
  } else {
    assertIcnsHeader(buffer, asset);
  }
}

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
    extendInfo: {
      LSUIElement: true,
    },
  },
  rebuildConfig: {},
  hooks: {
    generateAssets: async () => {
      const generateIconsPath = path.join(__dirname, 'scripts', 'generate-icons.js');
      require(generateIconsPath);

      for (const asset of [
        { iconPath: './out/icons/icon.png', type: 'png', width: 1024, height: 1024 },
        { iconPath: './out/icons/icon.icns', type: 'icns' },
        { iconPath: './out/icons/icon.ico', type: 'ico' },
        { iconPath: './out/icons/iconTemplate.png', type: 'png', width: 16, height: 16 },
      ] satisfies IconAsset[]) {
        validateIconAsset(asset);
      }
    },
  },
  makers: [
    new MakerSquirrel({
      name: 'MaxLaunchpad',
      setupIcon: './out/icons/icon.ico',
    }),
    new MakerDMG(
      {
        name: 'MaxLaunchpad',
        icon: './out/icons/icon.icns',
      },
      ['darwin'],
    ),
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
      devContentSecurityPolicy:
        "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'self' ws://localhost:* ws://0.0.0.0:*;",
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
