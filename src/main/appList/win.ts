import type { InstalledApp } from '../../shared/types';
import { runPowerShell } from '../utils/powershell';
import { isUwpAppId } from '../utils/winAppId';

export async function listWindowsApps(): Promise<InstalledApp[]> {
  try {
    const stdout = await runPowerShell('Get-StartApps | ConvertTo-Json -Compress', {
      timeout: 30000,
    });
    if (!stdout) return [];

    const apps = JSON.parse(stdout);

    const appArray = Array.isArray(apps) ? apps : [apps];

    return appArray
      .filter(
        (app: { Name?: string; AppID?: string }) => app.Name && app.AppID && isUwpAppId(app.AppID),
      )
      .map((app: { Name: string; AppID: string }) => ({
        label: app.Name,
        filePath: `shell:AppsFolder\\${app.AppID}`,
      }));
  } catch {
    return [];
  }
}
