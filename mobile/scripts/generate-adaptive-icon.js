#!/usr/bin/env node
'use strict';

const Jimp = require('jimp');
const path = require('path');

async function main() {
  const srcPath  = path.join(__dirname, '../assets/softtime-white.png');
  const destPath = path.join(__dirname, '../assets/adaptive-icon-foreground.png');

  const src = await Jimp.read(srcPath);

  // Foreground canvas: 1024×1024, fully transparent
  const out = new Jimp(1024, 1024, 0x00000000);

  // Logo occupies 60% of the canvas center (20% padding each side)
  const logoSize = Math.round(1024 * 0.60);
  const offset   = Math.round((1024 - logoSize) / 2);

  const logo = src.clone().resize(logoSize, logoSize, Jimp.RESIZE_LANCZOS);

  // White bg → transparent, Blue content → white
  logo.scan(0, 0, logo.getWidth(), logo.getHeight(), function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    // Pixels brighter than threshold are background → transparent
    const brightness = (r + g + b) / 3;
    if (brightness > 180) {
      this.bitmap.data[idx + 3] = 0; // transparent
    } else {
      // Content pixel → white
      this.bitmap.data[idx]     = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
      this.bitmap.data[idx + 3] = 255;
    }
  });

  out.composite(logo, offset, offset);
  await out.writeAsync(destPath);
  console.log('✓ adaptive-icon-foreground.png created at', destPath);
}

main().catch(e => { console.error(e); process.exit(1); });
