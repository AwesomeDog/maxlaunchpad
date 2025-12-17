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
const path = require('path');
const { execSync } = require('child_process');
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

  const hasSvgConverter = hasCmd('rsvg-convert') || hasCmd('magick');
  const hasImageMagick = hasCmd('magick');

  // Basic check: we need SVG converter for initial PNG
  if (!hasSvgConverter) {
    log.err('❌ Missing required dependencies (rsvg-convert or ImageMagick) for SVG processing.');
    process.exit(1);
  }

  // Fail if ImageMagick is missing (needed for ICO and Tray)
  if (!hasImageMagick) {
    log.err('❌ ImageMagick not found. Required for .ico and tray icons.');
    process.exit(1);
  }

  log.ok('✅ Dependencies ready');
}

// File helpers
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
  ];

  for (const { cmd, run } of converters) {
    if (hasCmd(cmd) && run() && fs.existsSync(out)) {
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
      log.ok('✅ icon.icns');
    } else {
      throw new Error('Conversion failed');
    }
  } catch (e) {
    log.err(`❌ Failed to generate ICNS: ${e.message}`);
  }
}

function generateICO() {
  log.step('\n🪟 Generating .ico...');
  const png = path.join(CONFIG.outputDir, 'icon.png');
  const out = path.join(CONFIG.outputDir, 'icon.ico');

  exec(`magick "${png}" -define icon:auto-resize=256,128,64,48,32,16 "${out}"`);
  log.ok('✅ icon.ico');
}

function generateTrayIcons() {
  log.step('\n🔧 Generating tray icons...');
  const t16 = path.join(CONFIG.outputDir, 'iconTemplate.png');
  const src = CONFIG.sourceSvg;
  const colorize = platform.isMacOS ? '-colorspace Gray -fill black -colorize 100%' : '';

  // 12.5% padding: 14x14 content in 16x16
  exec(
    `magick -background none -density 300 "${src}" -resize 14x14 -gravity center -extent 16x16 ${colorize} "${t16}"`,
  );
  log.ok('✅ Tray icons');
}

// Check if all icons already exist
function checkExistingIcons() {
  const requiredIcons = [
    path.join(CONFIG.outputDir, 'icon.png'),
    path.join(CONFIG.outputDir, 'icon.icns'),
    path.join(CONFIG.outputDir, 'icon.ico'),
    path.join(CONFIG.outputDir, 'iconTemplate.png'),
  ];

  return requiredIcons.every((icon) => fs.existsSync(icon));
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
