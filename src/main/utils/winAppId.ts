/**
 * Parse AppUserModelId from shell:AppsFolder path
 * @returns AppUserModelId or null
 */
export function parseAppUserModelId(path: string | undefined | null): string | null {
  if (!path) return null;
  const match = path.match(/shell:AppsFolder\\(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Check if an AppUserModelId represents a UWP (packaged) app
 * UWP apps have format: PackageFamilyName!AppId (e.g., Microsoft.WindowsCalculator_8wekyb3d8bbwe!App)
 * Win32 apps have format: CompanyName.AppName or {CLSID}\xxx.exe
 */
export function isUwpAppId(appUserModelId: string): boolean {
  return appUserModelId.includes('!');
}
