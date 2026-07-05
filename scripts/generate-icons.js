#!/usr/bin/env node

/**
 * Icon Generation Script
 * ======================
 * Generates all required icon formats from icon.svg for Electron applications.
 *
 * Output formats:
 *   - icon.png (1024x1024) - Base PNG icon
 *   - icon.icns - macOS application icon
 *   - icon.ico - Windows application icon
 *   - iconTemplate.png - Tray icon (16x16)
 *
 * Dependencies:
 *   - png2icons (npm package) for .icns generation
 *   - rsvg-convert (on macOS it is a MUST, all other methods are not working) or ImageMagick for SVG to PNG conversion
 *   - ImageMagick (magick/convert) for .ico generation
 *
 * Install dependencies:
 *   macOS:         brew install librsvg imagemagick
 *   Ubuntu/Debian: sudo apt-get install -y librsvg2-bin imagemagick dpkg fakeroot rpm
 *   Windows:       winget install ImageMagick.ImageMagick
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const png2icons = require('png2icons');

// Configuration
const CONFIG = {
  resourcesDir: path.join(__dirname, '../resources'),
  outputDir: path.join(__dirname, '../out/icons'),
  get sourceSvg() {
    return path.join(this.resourcesDir, 'icon.svg');
  },
};

const platform = {
  isWindows: process.platform === 'win32',
  isMacOS: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Logging
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};
const log = {
  info: (msg) => console.log(msg),
  ok: (msg) => console.log(`${c.green}${msg}${c.reset}`),
  warn: (msg) => console.log(`${c.yellow}${msg}${c.reset}`),
  err: (msg) => console.log(`${c.red}${msg}${c.reset}`),
  step: (msg) => console.log(`${c.blue}${msg}${c.reset}`),
};

// Shell utilities
function exec(cmd, silent = true) {
  try {
    return execSync(cmd, { stdio: silent ? 'pipe' : 'inherit' });
  } catch {
    return null;
  }
}

function hasCmd(cmd) {
  return exec(platform.isWindows ? `where ${cmd}` : `command -v ${cmd}`) !== null;
}

// Check dependencies
function checkDeps() {
  log.step('\n🔍 Checking dependencies...');

  const hasSvgConverter = hasCmd('rsvg-convert') || hasCmd('magick') || canUseElectronRenderer();
  const hasIcoConverter = hasCmd('magick') || Boolean(png2icons.createICO);

  // Basic check: we need SVG converter for initial PNG
  if (!hasSvgConverter) {
    log.err(
      '❌ Missing required dependencies (rsvg-convert, ImageMagick, or Electron) for SVG processing.',
    );
    process.exit(1);
  }

  if (!hasIcoConverter) {
    log.err('❌ Missing required dependencies (ImageMagick or png2icons) for .ico generation.');
    process.exit(1);
  }

  log.ok('✅ Dependencies ready');
}

// File helpers
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getRequiredIcons() {
  return [
    { filePath: path.join(CONFIG.outputDir, 'icon.png'), type: 'png', width: 1024, height: 1024 },
    { filePath: path.join(CONFIG.outputDir, 'icon.icns'), type: 'icns' },
    { filePath: path.join(CONFIG.outputDir, 'icon.ico'), type: 'ico' },
    {
      filePath: path.join(CONFIG.outputDir, 'iconTemplate.png'),
      type: 'png',
      width: 16,
      height: 16,
    },
  ];
}

function isRequiredIconFresh(iconPath, sourceMtimeMs) {
  if (!fs.existsSync(iconPath)) return false;

  const stat = fs.statSync(iconPath);
  return stat.size > 0 && stat.mtimeMs + 1000 >= sourceMtimeMs;
}

function validatePngDimensions(iconPath, expectedWidth, expectedHeight) {
  const buffer = fs.readFileSync(iconPath);
  if (buffer.length < 24 || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return false;
  }

  return buffer.readUInt32BE(16) === expectedWidth && buffer.readUInt32BE(20) === expectedHeight;
}

function validateIcoHeader(iconPath) {
  const buffer = fs.readFileSync(iconPath);
  return (
    buffer.length >= 6 &&
    buffer.readUInt16LE(0) === 0 &&
    buffer.readUInt16LE(2) === 1 &&
    buffer.readUInt16LE(4) > 0
  );
}

function validateIcnsHeader(iconPath) {
  const buffer = fs.readFileSync(iconPath);
  return buffer.length >= 8 && buffer.subarray(0, 4).toString('ascii') === 'icns';
}

function validateIconAsset(asset) {
  if (!fs.existsSync(asset.filePath)) return false;

  try {
    if (asset.type === 'png') {
      return validatePngDimensions(asset.filePath, asset.width, asset.height);
    }
    if (asset.type === 'ico') return validateIcoHeader(asset.filePath);
    if (asset.type === 'icns') return validateIcnsHeader(asset.filePath);
  } catch {
    return false;
  }

  return false;
}

function assertIconAsset(asset) {
  if (!validateIconAsset(asset)) {
    log.err(`❌ Invalid generated icon asset: ${asset.filePath}`);
    process.exit(1);
  }
}

function validateGeneratedIcons() {
  const sourceMtimeMs = fs.statSync(CONFIG.sourceSvg).mtimeMs;
  return getRequiredIcons().every((asset) => {
    return isRequiredIconFresh(asset.filePath, sourceMtimeMs) && validateIconAsset(asset);
  });
}

function canUseElectronRenderer() {
  try {
    require.resolve('electron');
    return true;
  } catch {
    return false;
  }
}

function renderSvgWithElectron(src, out, size, options = {}) {
  if (!canUseElectronRenderer()) return false;

  const electronPath = require('electron');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maxlaunchpad-render-icon-'));
  const scriptPath = path.join(tempDir, 'render-icon.js');
  const rendererScript = `
const { app, BrowserWindow } = require('electron');
const fs = require('fs');

const [src, out, sizeArg, contentSizeArg, templateArg] = process.argv.slice(2);
const size = Number(sizeArg);
const contentSize = Number(contentSizeArg);
const template = templateArg === 'true';

app.disableHardwareAcceleration();

app.whenReady()
  .then(async () => {
    const win = new BrowserWindow({
      width: size,
      height: size,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      webPreferences: {
        backgroundThrottling: false,
      },
    });
    const svg = fs.readFileSync(src, 'utf8');
    const svgUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    const offset = Math.round((size - contentSize) / 2);
    const filter = template ? 'filter:grayscale(1) brightness(0);' : '';
    const html = '<!doctype html><html><head><meta charset="utf-8"><style>html,body{width:100%;height:100%;margin:0;background:transparent;overflow:hidden;}img{position:absolute;left:' + offset + 'px;top:' + offset + 'px;width:' + contentSize + 'px;height:' + contentSize + 'px;object-fit:contain;display:block;' + filter + '}</style></head><body><img src="' + svgUrl + '"></body></html>';
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await win.webContents.executeJavaScript("new Promise((resolve, reject) => { const img = document.querySelector('img'); if (!img) { reject(new Error('Icon image element missing')); return; } const finish = () => { if (img.naturalWidth > 0 && img.naturalHeight > 0) resolve(true); else reject(new Error('Icon image failed to decode')); }; if (typeof img.decode === 'function') { img.decode().then(finish, reject); } else if (img.complete) { finish(); } else { img.onload = finish; img.onerror = () => reject(new Error('Icon image failed to load')); } })");
    const image = await win.capturePage();
    fs.writeFileSync(out, image.resize({ width: size, height: size }).toPNG());
    app.quit();
  })
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
`;

  try {
    fs.writeFileSync(scriptPath, rendererScript, 'utf8');
    const result = spawnSync(
      electronPath,
      [
        scriptPath,
        src,
        out,
        String(size),
        String(options.contentSize ?? size),
        String(Boolean(options.template)),
      ],
      {
        stdio: 'inherit',
      },
    );
    return result.status === 0 && fs.existsSync(out);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      /* ignore cleanup failure */
    }
  }
}

// Icon generation
function generatePNG() {
  log.step('\n📸 Generating PNG...');
  const out = path.join(CONFIG.outputDir, 'icon.png');
  const src = CONFIG.sourceSvg;

  const converters = [
    { cmd: 'rsvg-convert', run: () => exec(`rsvg-convert -w 1024 -h 1024 "${src}" -o "${out}"`) },
    {
      cmd: 'magick',
      run: () => {
        return exec(`magick -density 300 -background none "${src}" -resize 1024x1024 "${out}"`);
      },
    },
    {
      cmd: 'electron',
      run: () => renderSvgWithElectron(src, out, 1024),
    },
  ];

  for (const { cmd, run } of converters) {
    if (
      (cmd === 'electron' ? canUseElectronRenderer() : hasCmd(cmd)) &&
      run() &&
      validateIconAsset({ filePath: out, type: 'png', width: 1024, height: 1024 })
    ) {
      log.ok('✅ icon.png');
      return;
    }
  }
  log.err('❌ Failed to generate PNG');
  process.exit(1);
}

function generateICNS() {
  log.step('\n🍎 Generating .icns...');
  const pngPath = path.join(CONFIG.outputDir, 'icon.png');
  const outPath = path.join(CONFIG.outputDir, 'icon.icns');

  try {
    const input = fs.readFileSync(pngPath);
    // Use Bilinear interpolation (1) which is high quality but faster than Bicubic
    const output = png2icons.createICNS(input, png2icons.BILINEAR, 0);

    if (output) {
      fs.writeFileSync(outPath, output);
      assertIconAsset({ filePath: outPath, type: 'icns' });
      log.ok('✅ icon.icns');
    } else {
      throw new Error('Conversion failed');
    }
  } catch (e) {
    log.err(`❌ Failed to generate ICNS: ${e.message}`);
    process.exit(1);
  }
}

function generateICO() {
  log.step('\n🪟 Generating .ico...');
  const png = path.join(CONFIG.outputDir, 'icon.png');
  const out = path.join(CONFIG.outputDir, 'icon.ico');

  if (hasCmd('magick')) {
    if (!exec(`magick "${png}" -define icon:auto-resize=256,128,64,48,32,16 "${out}"`)) {
      log.err('❌ Failed to generate ICO');
      process.exit(1);
    }
    assertIconAsset({ filePath: out, type: 'ico' });
    log.ok('✅ icon.ico');
    return;
  }

  const input = fs.readFileSync(png);
  const output = png2icons.createICO(input, png2icons.BILINEAR, 0, false, true);
  if (!output) {
    log.err('❌ Failed to generate ICO');
    process.exit(1);
  }
  fs.writeFileSync(out, output);
  assertIconAsset({ filePath: out, type: 'ico' });
  log.ok('✅ icon.ico');
}

function generateTrayIcons() {
  log.step('\n🔧 Generating tray icons...');
  const t16 = path.join(CONFIG.outputDir, 'iconTemplate.png');
  const src = CONFIG.sourceSvg;
  const colorize = platform.isMacOS ? '-colorspace Gray -fill black -colorize 100%' : '';

  if (!hasCmd('magick')) {
    if (renderSvgWithElectron(src, t16, 16, { contentSize: 14, template: platform.isMacOS })) {
      assertIconAsset({ filePath: t16, type: 'png', width: 16, height: 16 });
      log.ok('✅ Tray icons');
      return;
    }
    log.err('❌ Failed to generate tray icons');
    process.exit(1);
  }

  // 12.5% padding: 14x14 content in 16x16
  exec(
    `magick -background none -density 300 "${src}" -resize 14x14 -gravity center -extent 16x16 ${colorize} "${t16}"`,
  );
  assertIconAsset({ filePath: t16, type: 'png', width: 16, height: 16 });
  log.ok('✅ Tray icons');
}

// Check if all icons already exist
function checkExistingIcons() {
  return validateGeneratedIcons();
}

// Main
function main() {
  log.info('🎨 Icon Generation');
  log.info('==================');

  if (!fs.existsSync(CONFIG.sourceSvg)) {
    log.err(`❌ ${CONFIG.sourceSvg} not found`);
    process.exit(1);
  }

  // Skip if all icons already exist
  if (checkExistingIcons()) {
    log.ok('✅ All icons already exist, skipping generation');
    return;
  }

  ensureDir(CONFIG.outputDir);
  checkDeps();

  generatePNG();
  generateICNS();
  generateICO();
  generateTrayIcons();
  if (!validateGeneratedIcons()) {
    log.err('❌ Generated icon validation failed');
    process.exit(1);
  }

  log.info('\n==================');
  log.ok('✨ Done!');
  log.info(`Output: ${CONFIG.outputDir}`);
}

// Support being imported as a module or executed directly
if (require.main === module) {
  // Executing script directly
  main();
} else {
  // Being require()'d, execute immediately
  main();
}
