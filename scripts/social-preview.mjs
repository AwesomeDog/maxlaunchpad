#!/usr/bin/env node
/**
 * Generate the GitHub repo social preview card (1280x640 PNG, <1MB).
 *
 * Output: docs/img/social-preview.svg (editable source of truth)
 *         docs/img/social-preview.png (upload this to
 *         Settings -> General -> Social preview)
 *
 * Idempotent: no timestamps, no randomness, no network.
 * The app screenshot is embedded as base64, so the SVG is self-contained.
 *
 * Usage: node scripts/social-preview.mjs
 * Requires rsvg-convert (preferred) or ImageMagick for the PNG step.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

// ---------------------------------------------------------------------------
// Copy — edit strings here, not markup
// ---------------------------------------------------------------------------
const COPY = {
  badge: "KEYBOARD-DRIVEN APP LAUNCHER",
  title: "MaxLaunchpad",
  tagline: "One keystroke. Every app. No typing, no searching.",
};

// ---------------------------------------------------------------------------
// Layout (all numbers in card px, card is 1280x640)
// ---------------------------------------------------------------------------
const CARD = { W: 1280, H: 640 };

const COLORS = {
  bgTop: "#221A14",
  bgBottom: "#0C0907",
  glow: "#F97316",
  text: "#FFFFFF",
  tagline: "#D6D3D1",
  platform: "#A8A29E",
  badgeText: "#FDBA74",
  badgeBorder: "rgba(249,115,22,0.55)",
  badgeFill: "rgba(249,115,22,0.14)",
  shotBack: "#FFFFFF",
  shotStroke: "rgba(255,255,255,0.16)",
};

const TEXT = {
  badgeFont: 14,
  badgeY: 76, // pill vertical centre
  titleFont: 78,
  titleBaseline: 170,
  taglineFont: 26,
  taglineBaseline: 222,
};

// App icon, drawn to the left of the title. Rendered width of COPY.title at
// TEXT.titleFont — measure again if you change the title or its font size
// (the icon+title group is centred from this number).
const ICON = {
  size: 72,
  gap: 22,
  titleWidth: 572,
  baselineShift: 29, // distance from title baseline to icon vertical centre
};

// Screenshot card: the whole app window, cropped to the window bounds (the
// source PNG has black margins: window is x 61..1060, y 55..691 of 1122x759).
// Sized from its own aspect ratio, centred, anchored to a bottom margin; the
// text block fills the space above.
const SHOT = {
  crop: { x: 61, y: 55, w: 1000, h: 637 }, // source px inside the screenshot
  srcW: 1122,
  srcH: 759,
  width: 560, // on-card width
  bottomMargin: 40,
  rx: 14,
  // Screenshot stays in the background: a touch of opacity loss plus a dark
  // vignette that melts its edges into the card background.
  opacity: 0.94,
  vignette: 0.6,
};

// Derived
const shotHeight = Math.round((SHOT.width * SHOT.crop.h) / SHOT.crop.w);
const shotX = Math.round((CARD.W - SHOT.width) / 2);
const shotY = CARD.H - SHOT.bottomMargin - shotHeight;
const shotScale = SHOT.width / SHOT.crop.w;

// ---------------------------------------------------------------------------
// Inputs / outputs
// ---------------------------------------------------------------------------
const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const SCREENSHOT = path.join(ROOT, "docs", "assets", "screenshot.png");
const OUT_DIR = path.join(ROOT, "docs", "img");

if (!existsSync(SCREENSHOT)) {
  console.error(`Screenshot not found: ${SCREENSHOT}`);
  process.exit(1);
}

const ICON_PATH = path.join(ROOT, "out", "icons", "icon.png");
if (!existsSync(ICON_PATH)) {
  console.error(`App icon not found: ${ICON_PATH}`);
  console.error("Build it first: npm run generate-icons");
  process.exit(1);
}

const shotB64 = readFileSync(SCREENSHOT).toString("base64");
const iconB64 = readFileSync(ICON_PATH).toString("base64");

// Icon + title centred as one group
const titleGroupW = ICON.size + ICON.gap + ICON.titleWidth;
const iconX = Math.round((CARD.W - titleGroupW) / 2);
const iconY = Math.round(TEXT.titleBaseline - ICON.baselineShift - ICON.size / 2);
const titleX = iconX + ICON.size + ICON.gap;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CARD.W}" height="${CARD.H}" viewBox="0 0 ${CARD.W} ${CARD.H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${COLORS.bgTop}"/>
      <stop offset="1" stop-color="${COLORS.bgBottom}"/>
    </linearGradient>
    <radialGradient id="glowL" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${COLORS.glow}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${COLORS.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${COLORS.glow}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${COLORS.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shotVignette" cx="0.5" cy="0.5" r="0.72">
      <stop offset="0.5" stop-color="${COLORS.bgBottom}" stop-opacity="0"/>
      <stop offset="1" stop-color="${COLORS.bgBottom}" stop-opacity="${SHOT.vignette}"/>
    </radialGradient>
    <clipPath id="shotClip">
      <rect x="${shotX}" y="${shotY}" width="${SHOT.width}" height="${shotHeight}" rx="${SHOT.rx}"/>
    </clipPath>
  </defs>

  <!-- background -->
  <rect width="${CARD.W}" height="${CARD.H}" fill="url(#bg)"/>
  <ellipse cx="180" cy="90" rx="520" ry="330" fill="url(#glowL)"/>
  <ellipse cx="1160" cy="600" rx="560" ry="360" fill="url(#glowR)"/>

  <!-- text block -->
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif" text-anchor="middle">
    <rect x="${CARD.W / 2 - 200}" y="${TEXT.badgeY - 16}" width="400" height="32" rx="16"
          fill="${COLORS.badgeFill}" stroke="${COLORS.badgeBorder}" stroke-width="1"/>
    <text x="${CARD.W / 2}" y="${TEXT.badgeY + 5}" font-size="${TEXT.badgeFont}"
          font-weight="600" letter-spacing="2.5" fill="${COLORS.badgeText}">${COPY.badge}</text>

    <image href="data:image/png;base64,${iconB64}" xlink:href="data:image/png;base64,${iconB64}"
           x="${iconX}" y="${iconY}" width="${ICON.size}" height="${ICON.size}"/>
    <text x="${titleX}" y="${TEXT.titleBaseline}" font-size="${TEXT.titleFont}"
          font-weight="700" text-anchor="start" fill="${COLORS.text}">${COPY.title}</text>

    <text x="${CARD.W / 2}" y="${TEXT.taglineBaseline}" font-size="${TEXT.taglineFont}"
          fill="${COLORS.tagline}">${COPY.tagline}</text>
  </g>

  <!-- screenshot: crop + scale via clipPath (broad renderer support) -->
  <g clip-path="url(#shotClip)" opacity="${SHOT.opacity}">
    <rect x="${shotX}" y="${shotY}" width="${SHOT.width}" height="${shotHeight}" fill="${COLORS.shotBack}"/>
    <image href="data:image/png;base64,${shotB64}" xlink:href="data:image/png;base64,${shotB64}"
           x="${shotX - SHOT.crop.x * shotScale}" y="${shotY - SHOT.crop.y * shotScale}"
           width="${SHOT.srcW * shotScale}" height="${SHOT.srcH * shotScale}"/>
    <rect x="${shotX}" y="${shotY}" width="${SHOT.width}" height="${shotHeight}" fill="url(#shotVignette)"/>
  </g>
  <rect x="${shotX}" y="${shotY}" width="${SHOT.width}" height="${shotHeight}" rx="${SHOT.rx}"
        fill="none" stroke="${COLORS.shotStroke}" stroke-width="1"/>
</svg>`;

mkdirSync(OUT_DIR, { recursive: true });
const svgPath = path.join(OUT_DIR, "social-preview.svg");
const pngPath = path.join(OUT_DIR, "social-preview.png");
writeFileSync(svgPath, svg);
console.log(`Wrote ${path.relative(ROOT, svgPath)}`);

// ---------------------------------------------------------------------------
// Rasterise: rsvg-convert first (proper gradients / embedded images),
// fall back to ImageMagick.
// ---------------------------------------------------------------------------
function rasterise() {
  const argsList = [
    { cmd: "rsvg-convert", args: ["-w", String(CARD.W), "-h", String(CARD.H), "-o", pngPath, svgPath] },
    { cmd: "magick", args: ["-background", "none", svgPath, "-resize", `${CARD.W}x${CARD.H}!`, pngPath] },
    { cmd: "convert", args: ["-background", "none", svgPath, "-resize", `${CARD.W}x${CARD.H}!`, pngPath] },
  ];
  for (const { cmd, args } of argsList) {
    try {
      execFileSync(cmd, args, { stdio: "inherit" });
      return cmd;
    } catch (err) {
      if (err.code === "ENOENT") continue; // renderer not installed, try next
      throw err;
    }
  }
  console.error("No SVG rasteriser found. Install librsvg (brew install librsvg) or ImageMagick.");
  process.exit(1);
}

const used = rasterise();
console.log(`Wrote ${path.relative(ROOT, pngPath)} (via ${used})`);
