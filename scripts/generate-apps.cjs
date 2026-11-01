// ---------------------------------------------------------
// Imports
// ---------------------------------------------------------
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ---------------------------------------------------------
// Constants
// ---------------------------------------------------------
const OUTPUT_PATH = path.resolve('./public/data/apps-data.json');
const LOGO_DIR = path.resolve('./public/assets/apps');
const SOURCE_URL = 'https://raw.githubusercontent.com/jishnu-kv/WinUI-Apps-List/refs/heads/main/README.md';
const LOGOS_SOURCE_URL = 'https://raw.githubusercontent.com/jishnu-kv/WinUI-Apps-List/refs/heads/main/apps_logo.yml';

// ---------------------------------------------------------
// Utilities
// ---------------------------------------------------------
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function runWithConcurrencyLimit(tasks, limit = 5) {
  const results = [];
  const queue = [...tasks];

  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const task = queue.shift();
      try {
        results.push(await task());
      } catch (err) {
        console.warn('! Task failed:', err.message);
      }
    }
  });

  await Promise.all(workers);
  return results;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/\s\(.+\)/, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse ICO file and extract all images to try
function parseIco(buffer) {
  if (buffer.length < 6) throw new Error('Invalid ICO file');

  const count = buffer.readUInt16LE(4);
  if (count === 0) throw new Error('No images in ICO');

  const images = [];

  for (let i = 0; i < count; i++) {
    const offset = 6 + i * 16;
    if (offset + 16 > buffer.length) break;

    const width = buffer[offset] || 256;
    const height = buffer[offset + 1] || 256;
    const bpp = buffer.readUInt16LE(offset + 6);
    const imageSize = buffer.readUInt32LE(offset + 8);
    const imageOffset = buffer.readUInt32LE(offset + 12);

    if (imageOffset + imageSize <= buffer.length) {
      const imageData = buffer.slice(imageOffset, imageOffset + imageSize);
      const isPng = imageData[0] === 0x89 &&
                    imageData[1] === 0x50 &&
                    imageData[2] === 0x4E &&
                    imageData[3] === 0x47;

      images.push({
        width,
        height,
        size: width * height,
        bpp,
        data: imageData,
        isPng
      });
    }
  }

  if (images.length === 0) throw new Error('Could not extract images from ICO');

  images.sort((a, b) => {
    if (a.isPng !== b.isPng) return b.isPng ? 1 : -1;
    if (a.size !== b.size) return b.size - a.size;
    return b.bpp - a.bpp;
  });

  return images;
}

function convertDibToRgba(dib) {
  if (dib.length < 40) return null;
  const biSize = dib.readUInt32LE(0);
  const biWidth = dib.readInt32LE(4);
  const biHeight = Math.abs(dib.readInt32LE(8)) / 2;
  const biBitCount = dib.readUInt16LE(14);

  if (biBitCount === 32) {
    const pixelData = dib.slice(biSize);
    const rgba = Buffer.alloc(biWidth * biHeight * 4);
    for (let y = 0; y < biHeight; y++) {
      const srcRow = (biHeight - 1 - y) * biWidth * 4;
      const dstRow = y * biWidth * 4;
      for (let x = 0; x < biWidth; x++) {
        const srcIdx = srcRow + x * 4;
        const dstIdx = dstRow + x * 4;
        if (srcIdx + 3 < pixelData.length) {
          rgba[dstIdx] = pixelData[srcIdx + 2];
          rgba[dstIdx + 1] = pixelData[srcIdx + 1];
          rgba[dstIdx + 2] = pixelData[srcIdx];
          rgba[dstIdx + 3] = pixelData[srcIdx + 3];
        }
      }
    }
    return { rgba, width: biWidth, height: biHeight };
  } else if (biBitCount === 8) {
    const palette = dib.slice(biSize, biSize + 1024);
    const rowSize = Math.floor((biWidth * 8 + 31) / 32) * 4;
    const pixelData = dib.slice(biSize + 1024);
    const maskRowSize = Math.floor((biWidth + 31) / 32) * 4;
    const maskData = pixelData.slice(rowSize * biHeight);
    const rgba = Buffer.alloc(biWidth * biHeight * 4);
    for (let y = 0; y < biHeight; y++) {
      const srcRow = (biHeight - 1 - y) * rowSize;
      const dstRow = y * biWidth * 4;
      const maskRow = (biHeight - 1 - y) * maskRowSize;
      for (let x = 0; x < biWidth; x++) {
        const colorIndex = pixelData[srcRow + x];
        const palIdx = colorIndex * 4;
        const dstIdx = dstRow + x * 4;
        const isTransparent = maskData.length > maskRow + Math.floor(x / 8)
          ? (maskData[maskRow + Math.floor(x / 8)] & (1 << (7 - (x % 8)))) !== 0
          : false;
        rgba[dstIdx] = palette[palIdx + 2];
        rgba[dstIdx + 1] = palette[palIdx + 1];
        rgba[dstIdx + 2] = palette[palIdx];
        rgba[dstIdx + 3] = isTransparent ? 0 : 255;
      }
    }
    return { rgba, width: biWidth, height: biHeight };
  }
  return null;
}

async function downloadAndConvertLogo(url, filename) {
  const outputPath = path.join(LOGO_DIR, `${filename}.webp`);

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());

    if (url.endsWith('.ico')) {
      try {
        const images = parseIco(buffer);
        let converted = false;
        for (const img of images) {
          try {
            if (img.isPng) {
              await sharp(img.data)
                .resize(64, 64, {
                  fit: 'contain',
                  background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

              converted = true;
              return `/assets/apps/${filename}.webp`;
            }

            const rawRgba = convertDibToRgba(img.data);
            if (rawRgba) {
              await sharp(rawRgba.rgba, { raw: { width: rawRgba.width, height: rawRgba.height, channels: 4 } })
                .resize(64, 64, {
                  fit: 'contain',
                  background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

              converted = true;
              return `/assets/apps/${filename}.webp`;
            }
          } catch {
            continue;
          }
        }
        if (!converted) throw new Error('No supported image format found in ICO');
      } catch (icoErr) {
        console.warn(`! ICO conversion failed for ${filename}: ${icoErr.message}`);
        return null;
      }
    }

    await sharp(buffer)
      .resize(64, 64, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return `/assets/apps/${filename}.webp`;
  } catch (err) {
    console.warn(`x Failed ${filename} (${url}): ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------
// YAML Parser for apps_logo.yml
// ---------------------------------------------------------
function parseLogosYaml(yamlText) {
  const logoByLink = new Map();
  const logoByName = new Map();
  let curEntry = null;

  for (const line of yamlText.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- name:')) {
      if (curEntry && curEntry.name) {
        if (curEntry.link) logoByLink.set(curEntry.link.trim().toLowerCase().replace(/\/+$/, ''), curEntry.logo);
        logoByName.set(curEntry.name.trim().toLowerCase(), curEntry.logo);
      }
      curEntry = { name: trimmed.replace(/^- name:\s*/, '').replace(/^["']|["']$/g, '') };
    } else if (curEntry && trimmed.startsWith('link:')) {
      curEntry.link = trimmed.replace(/^link:\s*/, '').replace(/^["']|["']$/g, '');
    } else if (curEntry && trimmed.startsWith('logo:')) {
      curEntry.logo = trimmed.replace(/^logo:\s*/, '').replace(/^["']|["']$/g, '');
    }
  }
  if (curEntry && curEntry.name) {
    if (curEntry.link) logoByLink.set(curEntry.link.trim().toLowerCase().replace(/\/+$/, ''), curEntry.logo);
    logoByName.set(curEntry.name.trim().toLowerCase(), curEntry.logo);
  }

  return { logoByLink, logoByName };
}

// ---------------------------------------------------------
// Markdown Parser
// ---------------------------------------------------------
function parseAppsMarkdown(markdown, logoByLink, logoByName) {
  const lines = markdown.split('\n');
  const startIndex = lines.findIndex((l) => /^#+\s+📑\s*Apps List/i.test(l.trim()));

  if (startIndex === -1) {
    console.error('x Could not find "Apps List" header in README');
    return [];
  }

  const groups = [];
  let currentGroup = null;
  let currentSub = null;
  let currentSection = null;

  const filteredLines = lines.slice(startIndex + 1);

  for (const line of filteredLines) {
    const trimmed = line.trim();

    // Stop if another top-level h1 header is encountered
    if (trimmed.startsWith('# ') && !trimmed.includes('Apps List')) {
      break;
    }

    // Category: ##
    if (trimmed.startsWith('## ')) {
      const heading = trimmed.replace(/^##\s+/, '').trim();
      currentGroup = { heading, subgroups: [] };
      groups.push(currentGroup);
      currentSub = null;
      currentSection = null;
      continue;
    }

    // Subcategory: ###
    if (trimmed.startsWith('### ')) {
      if (!currentGroup) {
        currentGroup = { heading: '', subgroups: [] };
        groups.push(currentGroup);
      }

      const imgMatch = trimmed.match(/<img[^>]+src="([^"]+)"/);
      const iconUrl = imgMatch ? imgMatch[1] : null;

      const cleanHeading = trimmed
        .replace(/^###\s+/, '')
        .replace(/<img[^>]+>/, '')
        .trim();

      currentSub = {
        subheading: cleanHeading,
        icon_url: iconUrl,
        apps: [],
        sections: []
      };
      currentGroup.subgroups.push(currentSub);
      currentSection = null;
      continue;
    }

    // Sub-subheading / Section: ####
    if (trimmed.startsWith('#### ')) {
      if (!currentGroup) {
        currentGroup = { heading: '', subgroups: [] };
        groups.push(currentGroup);
      }
      if (!currentSub) {
        currentSub = { subheading: '', apps: [], sections: [] };
        currentGroup.subgroups.push(currentSub);
      }

      const imgMatch = trimmed.match(/<img[^>]+src="([^"]+)"/);
      const iconUrl = imgMatch ? imgMatch[1] : null;

      const cleanHeading = trimmed
        .replace(/^####\s+/, '')
        .replace(/<img[^>]+>/, '')
        .trim();

      currentSection = {
        heading: cleanHeading,
        icon_url: iconUrl,
        apps: []
      };
      currentSub.sections.push(currentSection);
      continue;
    }

    // App entry: -
    if (trimmed.startsWith('- ')) {
      const nameMatch = trimmed.match(/\[(.*?)\]\((.*?)\)/);
      if (!nameMatch) continue;

      const [, name, link] = nameMatch;

      // Extract all tags in backticks before the [Name]
      const prefix = trimmed.substring(2, trimmed.indexOf('['));
      const tags = [...prefix.matchAll(/`([^`]+)`/g)].map(m => m[1]);
      const tag = tags[0] || 'WD';

      let price = 'Free';
      if (trimmed.includes('💰')) price = 'Paid';
      else if (/`FOSS`/i.test(trimmed)) price = 'FOSS';

      // Find logo URL from logo maps or inline comment (fallback)
      const normLink = link.trim().toLowerCase().replace(/\/+$/, '');
      const normName = name.trim().toLowerCase();
      let remoteLogoUrl = logoByLink.get(normLink) || logoByName.get(normName) || null;

      if (!remoteLogoUrl) {
        const logoRegex = new RegExp('<!--\\s*logo:\\s*(https?:\\/\\/[^\\s>]+)\\s*-->', 'i');
        const logoMatch = trimmed.match(logoRegex);
        if (logoMatch) remoteLogoUrl = logoMatch[1];
      }

      const filename = slugify(name);
      const localWebpPath = path.join(LOGO_DIR, `${filename}.webp`);
      let logoUrl = fs.existsSync(localWebpPath) ? `/assets/apps/${filename}.webp` : remoteLogoUrl;

      const appData = {
        name,
        link,
        tag,
        tags: tags.length > 0 ? tags : [tag],
        price,
        logo_url: logoUrl || undefined,
        original_logo_url: remoteLogoUrl || undefined
      };

      if (!currentGroup) {
        currentGroup = { heading: '', subgroups: [] };
        groups.push(currentGroup);
      }
      if (!currentSub) {
        currentSub = { subheading: '', apps: [], sections: [] };
        currentGroup.subgroups.push(currentSub);
      }

      if (currentSection) {
        currentSection.apps.push(appData);
        currentSub.apps.push(appData);
      } else {
        currentSub.apps.push(appData);
      }
    }
  }

  return groups
    .map(g => ({
      ...g,
      subgroups: g.subgroups
        .map(sg => {
          const res = { ...sg };
          if (res.sections && res.sections.length === 0) {
            delete res.sections;
          }
          return res;
        })
        .filter(sg => sg.apps.length > 0 || (sg.sections && sg.sections.some(s => s.apps.length > 0)))
    }))
    .filter(g => g.subgroups.length > 0);
}

// ---------------------------------------------------------
// Main
// ---------------------------------------------------------
async function generateApps() {
  ensureDir(LOGO_DIR);

  console.log('↻ Fetching latest apps data and logos from GitHub...');
  const resMd = await fetch(SOURCE_URL);
  if (!resMd.ok) throw new Error(`HTTP ${resMd.status} fetching README`);
  const markdown = await resMd.text();

  const resLogos = await fetch(LOGOS_SOURCE_URL);
  if (!resLogos.ok) throw new Error(`HTTP ${resLogos.status} fetching apps_logo.yml`);
  const yamlText = await resLogos.text();

  const { logoByLink, logoByName } = parseLogosYaml(yamlText);
  const parsed = parseAppsMarkdown(markdown, logoByLink, logoByName);

  const downloadTasks = [];

  for (const group of parsed) {
    for (const sub of group.subgroups) {
      // Category / Subcategory icon
      if (sub.icon_url && sub.icon_url.startsWith('http')) {
        const catFilename = `cat-${slugify(sub.subheading)}`;
        const localPath = path.join(LOGO_DIR, `${catFilename}.webp`);
        if (fs.existsSync(localPath)) {
          sub.icon_url = `/assets/apps/${catFilename}.webp`;
        } else {
          downloadTasks.push(async () => {
            const local = await downloadAndConvertLogo(sub.icon_url, catFilename);
            if (local) sub.icon_url = local;
          });
        }
      }

      // App logos
      for (const app of sub.apps) {
        const filename = slugify(app.name);
        const localPath = path.join(LOGO_DIR, `${filename}.webp`);

        if (fs.existsSync(localPath)) {
          app.logo_url = `/assets/apps/${filename}.webp`;
        } else if (app.original_logo_url) {
          downloadTasks.push(async () => {
            const local = await downloadAndConvertLogo(app.original_logo_url, filename);
            if (local) {
              app.logo_url = local;
            }
          });
        }
      }
    }
  }

  if (downloadTasks.length > 0) {
    console.log(`↓ Downloading and converting ${downloadTasks.length} missing logos (concurrency limit: 5)...`);
    await runWithConcurrencyLimit(downloadTasks, 5);
  } else {
    console.log('✓ All logos are already cached locally.');
  }

  // Ensure output directory exists
  ensureDir(path.dirname(OUTPUT_PATH));

  // Save file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(parsed, null, 2));

  console.log(`✓ Saved updated apps data (${parsed.length} groups) → ${OUTPUT_PATH}`);
}

generateApps().catch((err) => {
  console.error('✖ Failed to generate apps:', err);
  process.exit(1);
});