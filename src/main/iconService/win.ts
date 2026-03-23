import { app, NativeImage, nativeImage } from 'electron';

import type { KeyConfig } from '../../shared/types';
import { escapePS, runPowerShell } from '../utils/powershell';
import { isUwpAppId, parseAppUserModelId } from '../utils/winAppId';

export async function extractIcon(keyConfig: KeyConfig): Promise<NativeImage | null> {
  const strategies = getExtractionStrategies(keyConfig);

  for (const strategy of strategies) {
    const icon = await strategy();
    if (icon) return icon;
  }

  return null;
}

type IconSource =
  | { type: 'clsid-exe'; path: string }
  | { type: 'uwp-app'; appId: string; fallbackPath: string | null }
  | { type: 'shell-app'; appId: string; fallbackPath: string | null }
  | { type: 'exe-file'; path: string }
  | { type: 'lnk-file'; path: string }
  | { type: 'generic-file'; path: string }
  | { type: 'none' };

function identifyIconSource(keyConfig: KeyConfig): IconSource {
  const targetPath = keyConfig.iconPath || keyConfig.filePath;
  const appId = parseAppUserModelId(keyConfig.filePath) || parseAppUserModelId(keyConfig.arguments);

  if (appId) {
    const clsidExePath = parseClsidExePath(appId);
    if (clsidExePath) {
      return { type: 'clsid-exe', path: clsidExePath };
    }
    if (isUwpAppId(appId)) {
      return { type: 'uwp-app', appId, fallbackPath: targetPath };
    }
    return { type: 'shell-app', appId, fallbackPath: targetPath };
  }

  if (!targetPath) {
    return { type: 'none' };
  }

  if (targetPath.toLowerCase().endsWith('.exe')) {
    return { type: 'exe-file', path: targetPath };
  }

  if (targetPath.toLowerCase().endsWith('.lnk')) {
    return { type: 'lnk-file', path: targetPath };
  }

  return { type: 'generic-file', path: targetPath };
}

function getExtractionStrategies(keyConfig: KeyConfig): Array<() => Promise<NativeImage | null>> {
  const source = identifyIconSource(keyConfig);

  switch (source.type) {
    case 'clsid-exe':
      return [
        () => extractJumboIcon(source.path),
        () => extractExeIcon(source.path),
        () => getSystemIcon(source.path, 'large'),
      ];

    case 'uwp-app':
      return [
        () => extractUwpAppIcon(source.appId),
        () => getSystemIcon(source.fallbackPath, 'large'),
      ];

    case 'shell-app':
      return [
        () => extractWin32AppIconByAppId(source.appId),
        () => getSystemIcon(source.fallbackPath, 'large'),
      ];

    case 'exe-file':
      return [
        () => extractJumboIcon(source.path),
        () => extractExeIcon(source.path),
        () => getSystemIcon(source.path, 'large'),
      ];

    case 'lnk-file':
      return [
        () => extractJumboIcon(source.path),
        () => extractLnkIcon(source.path),
        () => getSystemIcon(source.path, 'large'),
      ];

    case 'generic-file':
      return [() => extractJumboIcon(source.path), () => getSystemIcon(source.path, 'normal')];

    case 'none':
      return [];
  }
}

// Known Windows CLSID (Known Folder GUIDs) mappings
// Values are environment variable names or direct paths
const CLSID_FOLDERS: Record<string, string> = {
  '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}': '%SystemRoot%\\System32',
  '{D65231B0-B2F1-4857-A4CE-A8E7C6EA7D27}': '%SystemRoot%\\SysWOW64',
  '{6D809377-6AF0-444B-8957-A3773F02200E}': '%ProgramFiles%', // ProgramFilesX64
  '{7C5A40EF-A0FB-4BFC-874A-C0F2E0B9FA8E}': '%ProgramFiles(x86)%', // ProgramFilesX86
  '{905E63B6-C1BF-494E-B29C-65B732D3D21A}': '%ProgramFiles%', // ProgramFiles
  '{F7F1ED05-9F6D-47A2-AAAE-29D317C6F066}': '%ProgramFiles%\\Common Files', // ProgramFilesCommon
};

function expandEnvVars(path: string): string {
  return path.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
}

/**
 * Parse CLSID-based exe path (e.g., {1AC14E77-...}\magnify.exe)
 * Returns the actual file system path or null
 */
function parseClsidExePath(appId: string): string | null {
  const match = appId.match(/^(\{[0-9A-Fa-f-]+\})\\(.+\.exe)$/i);
  if (!match) return null;

  const [, clsid, relativePath] = match;
  const baseFolder = CLSID_FOLDERS[clsid.toUpperCase()];
  if (!baseFolder) return null;

  return expandEnvVars(`${baseFolder}\\${relativePath}`);
}

async function getSystemIcon(
  path: string,
  size: 'small' | 'normal' | 'large',
): Promise<NativeImage | null> {
  try {
    return await app.getFileIcon(path, { size });
  } catch {
    return null;
  }
}

async function runPowerShellForIcon(script: string): Promise<NativeImage | null> {
  const base64Data = await runPowerShell(script);
  if (!base64Data) return null;

  const icon = nativeImage.createFromBuffer(Buffer.from(base64Data, 'base64'));
  return icon.isEmpty() ? null : icon;
}

const PS_EXTRACT_EXE_ICON = `
Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
if ($icon) {
  $bitmap = $icon.ToBitmap()
  $ms = New-Object System.IO.MemoryStream
  $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  [Convert]::ToBase64String($ms.ToArray())
  $ms.Close(); $bitmap.Dispose(); $icon.Dispose()
}`;

async function extractExeIcon(filePath: string): Promise<NativeImage | null> {
  const script = `$exePath = '${escapePS(filePath)}'\n${PS_EXTRACT_EXE_ICON}`;
  return runPowerShellForIcon(script);
}

async function extractLnkIcon(lnkPath: string): Promise<NativeImage | null> {
  const script = `
$ErrorActionPreference = 'Stop'
$wsh = New-Object -ComObject WScript.Shell
$lnk = $wsh.CreateShortcut('${escapePS(lnkPath)}')
$target = $lnk.TargetPath

if (-not $target -or -not (Test-Path $target)) { exit 1 }

Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($target)
if ($icon) {
  $bitmap = $icon.ToBitmap()
  $ms = New-Object System.IO.MemoryStream
  $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  [Convert]::ToBase64String($ms.ToArray())
  $ms.Close(); $bitmap.Dispose(); $icon.Dispose()
}`;
  return runPowerShellForIcon(script);
}

// PowerShell script that extracts a 256×256 (SHIL_JUMBO) shell icon for any file path.
const PS_EXTRACT_JUMBO_ICON = `
Add-Type -AssemblyName System.Drawing
$sdPath = [System.Reflection.Assembly]::GetAssembly([System.Drawing.Bitmap]).Location

Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public class JumboIcon {
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern uint PrivateExtractIcons(string lpszFile, int nIconIndex, int cxIcon, int cyIcon, IntPtr[] phicon, uint[] piconid, uint nIcons, uint flags);

    [DllImport("user32.dll")]
    static extern bool DestroyIcon(IntPtr h);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr LoadLibraryEx(string lpFileName, IntPtr hFile, uint dwFlags);
    
    [DllImport("kernel32.dll")]
    static extern bool FreeLibrary(IntPtr hModule);
    
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    static extern IntPtr FindResourceW(IntPtr hModule, IntPtr lpName, IntPtr lpType);
    
    [DllImport("kernel32.dll")]
    static extern IntPtr LoadResource(IntPtr hModule, IntPtr hResInfo);
    
    [DllImport("kernel32.dll")]
    static extern IntPtr LockResource(IntPtr hResData);
    
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    static extern bool EnumResourceNamesW(IntPtr hModule, IntPtr lpType, EnumResNameProc lpEnumFunc, IntPtr lParam);

    // Delegate definition for resource enumeration
    delegate bool EnumResNameProc(IntPtr hModule, IntPtr lpType, IntPtr lpName, IntPtr lParam);

    // Static reference to prevent Garbage Collector from reclaiming the delegate during P/Invoke
    private static EnumResNameProc _enumProc;

    private static bool HasRealJumboIcon(string path) {
        // LOAD_LIBRARY_AS_DATAFILE (0x02) to avoid executing code
        IntPtr hModule = LoadLibraryEx(path, IntPtr.Zero, 0x00000002);
        if (hModule == IntPtr.Zero) return false;

        bool found = false;
        
        // Assigning to a static variable to ensure it stays in memory during the call
        _enumProc = (hm, type, name, lp) => {
            IntPtr hResInfo = FindResourceW(hm, name, type);
            if (hResInfo == IntPtr.Zero) return true;

            IntPtr hResData = LoadResource(hm, hResInfo);
            IntPtr pData = LockResource(hResData);
            if (pData == IntPtr.Zero) return true;

            // Header: 6 bytes. Number of icons: at offset 4 (Int16)
            short count = Marshal.ReadInt16(pData, 4);
            for (int i = 0; i < count; i++) {
                // Each GRPICONDIRENTRY is 14 bytes. Width is at offset 6 + (i * 14)
                // A width value of 0 indicates 256px
                if (Marshal.ReadByte(pData, 6 + i * 14) == 0) {
                    found = true;
                    return false; // Stop enumerating
                }
            }
            return true;
        };

        try {
            // RT_GROUP_ICON = 14
            EnumResourceNamesW(hModule, (IntPtr)14, _enumProc, IntPtr.Zero);
            return found;
        } catch { 
            return false; 
        } finally {
            FreeLibrary(hModule);
            _enumProc = null; // Clear reference
        }
    }

    public static string Extract(string path) {
        if (!File.Exists(path) || !HasRealJumboIcon(path)) return null;

        IntPtr[] phicon = new IntPtr[1];
        uint[] piconid = new uint[1];

        // Request 256x256 icon directly from the first index
        uint count = PrivateExtractIcons(path, 0, 256, 256, phicon, piconid, 1, 0);
        
        if (count > 0 && phicon[0] != IntPtr.Zero) {
            try {
                using (Icon icon = Icon.FromHandle(phicon[0]))
                using (Bitmap bmp = icon.ToBitmap()) {
                    // Check if the OS actually returned a 256px image or just a stretched smaller one
                    if (bmp.Width < 256) return null;

                    using (MemoryStream ms = new MemoryStream()) {
                        bmp.Save(ms, ImageFormat.Png);
                        return Convert.ToBase64String(ms.ToArray());
                    }
                }
            } finally {
                DestroyIcon(phicon[0]);
            }
        }
        return null;
    }
}
"@ -ReferencedAssemblies $sdPath

[JumboIcon]::Extract($filePath)
`;

async function extractJumboIcon(filePath: string | null): Promise<NativeImage | null> {
  if (!filePath) return null;
  const script = `$filePath = '${escapePS(filePath)}'\n${PS_EXTRACT_JUMBO_ICON}`;
  return runPowerShellForIcon(script);
}

async function extractUwpAppIcon(appUserModelId: string): Promise<NativeImage | null> {
  const packageFamilyName = appUserModelId.split('!')[0];
  if (!packageFamilyName) return null;

  const script = `
$ErrorActionPreference = 'Stop'
$pkg = Get-AppxPackage | Where-Object { $_.PackageFamilyName -eq '${packageFamilyName}' } | Select-Object -First 1
if (-not $pkg) { exit 1 }

$manifestPath = Join-Path $pkg.InstallLocation 'AppxManifest.xml'
if (-not (Test-Path $manifestPath)) { exit 1 }

[xml]$manifest = Get-Content $manifestPath
$app = $manifest.Package.Applications.Application | Select-Object -First 1
$logoPath = $app.VisualElements.Square44x44Logo
if (-not $logoPath) { $logoPath = $app.VisualElements.Square150x150Logo }
if (-not $logoPath) { exit 1 }

# Find actual icon file (supports scale suffix)
$logoDir = Join-Path $pkg.InstallLocation (Split-Path $logoPath)
$baseName = [IO.Path]::GetFileNameWithoutExtension($logoPath)
$ext = [IO.Path]::GetExtension($logoPath)

$actualPath = @('.scale-200','.scale-150','.scale-125','.scale-100','') | ForEach-Object {
  $p = Join-Path $logoDir "$baseName$_$ext"
  if (Test-Path $p) { $p }
} | Select-Object -First 1

# Fallback: search Assets directory
if (-not $actualPath) {
  $assetsDir = Join-Path $pkg.InstallLocation 'Assets'
  if (Test-Path $assetsDir) {
    $actualPath = Get-ChildItem $assetsDir -Filter '*.png' | 
      Where-Object { $_.Name -match 'Logo|Icon' } | 
      Sort-Object Length -Descending | 
      Select-Object -First 1 -ExpandProperty FullName
  }
}

if (-not $actualPath -or -not (Test-Path $actualPath)) { exit 1 }
[Convert]::ToBase64String([IO.File]::ReadAllBytes($actualPath))`;

  return runPowerShellForIcon(script);
}

/**
 * Find exe path for Win32 app registered with AppUserModelId (non-UWP)
 * Strategy: 1) Find exe via Start Menu shortcuts  2) Search common install directories
 */
async function findWin32AppExePath(appUserModelId: string): Promise<string | null> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$appId = '${escapePS(appUserModelId)}'

# Get app info from shell:AppsFolder
$shell = New-Object -ComObject Shell.Application
$app = $shell.NameSpace('shell:AppsFolder').Items() | 
  Where-Object { $_.Path -eq $appId } | 
  Select-Object -First 1

$appName = if ($app) { $app.Name } else { $appId.Split('.')[-1] }
$searchNames = @($appName, $appId.Split('.')[-1]) | Select-Object -Unique

# Strategy 1: Search .lnk in Start Menu only (fast - few files)
$wsh = New-Object -ComObject WScript.Shell
$smUser = [Environment]::GetFolderPath('StartMenu') + '\\Programs'
$smCommon = [Environment]::GetFolderPath('CommonStartMenu') + '\\Programs'
@($smUser, $smCommon) | Where-Object { Test-Path $_ } | ForEach-Object {
  $lnks = Get-ChildItem $_ -Filter '*.lnk' -Recurse -ErrorAction SilentlyContinue
  foreach ($lnk in $lnks) {
    foreach ($name in $searchNames) {
      if ($lnk.BaseName -eq $name -or $lnk.BaseName -like "*$name*") {
        $target = $wsh.CreateShortcut($lnk.FullName).TargetPath
        if ($target -and (Test-Path $target)) {
          Write-Output $target; exit 0
        }
      }
    }
  }
}

# Strategy 2: Search exe in install directories (slower - only if lnk not found)
$x86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
$localPrograms = Join-Path $env:LOCALAPPDATA 'Programs'
@($localPrograms, $env:LOCALAPPDATA, $env:APPDATA, $env:ProgramFiles, $x86) | 
  Where-Object { $_ } | ForEach-Object {
    foreach ($name in $searchNames) {
      $subDir = Join-Path $_ $name
      if (Test-Path $subDir) {
        $exe = Get-ChildItem $subDir -Filter '*.exe' -Recurse -ErrorAction SilentlyContinue |
          Where-Object { $_.Name -notmatch 'unins|update|crash' } |
          Select-Object -First 1
        if ($exe) { Write-Output $exe.FullName; exit 0 }
      }
    }
  }
exit 1`;

  return runPowerShell(script);
}

async function extractWin32AppIconByAppId(appUserModelId: string): Promise<NativeImage | null> {
  const targetPath = await findWin32AppExePath(appUserModelId);
  if (!targetPath) return null;

  // Prefer 256×256 jumbo icon; fall back to exe extraction or system icon
  const jumbo = await extractJumboIcon(targetPath);
  if (jumbo) return jumbo;

  if (targetPath.toLowerCase().endsWith('.exe')) {
    return extractExeIcon(targetPath);
  }
  return getSystemIcon(targetPath, 'large');
}
