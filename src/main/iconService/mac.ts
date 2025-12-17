import { app, NativeImage, nativeImage } from 'electron';

import type { KeyConfig } from '../../shared/types';

export async function extractIcon(keyConfig: KeyConfig): Promise<NativeImage | null> {
  const targetPath = keyConfig.iconPath || keyConfig.filePath;

  // .app bundle
  if (targetPath.endsWith('.app')) {
    try {
      return await nativeImage.createThumbnailFromPath(targetPath, { width: 256, height: 256 });
    } catch {
      return app.getFileIcon(targetPath, { size: 'large' });
    }
  }

  // Other files
  return app.getFileIcon(targetPath, { size: 'large' });
}
