const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Target directories
const microsoftIconsDir = path.join(__dirname, '..', 'microsoft-fluent-icons');
const userIconsBaseDir = path.join(__dirname, '..', 'public', 'icons');
const metadataPath = path.join(__dirname, '..', 'public', 'data', 'icon_metadata.json');
const iconUrlPath = path.join(__dirname, '..', 'public', 'data', 'icon_url.json');
const homePagePath = path.join(__dirname, '..', 'src', 'pages', 'HomePage.tsx');
const newIconsPath = path.join(__dirname, '..', 'public', 'data', 'new_icons.json');

const userDirs = {
  filled: path.join(userIconsBaseDir, 'icon_filled'),
  regular: path.join(userIconsBaseDir, 'icon_regular'),
  color: path.join(userIconsBaseDir, 'icon_color')
};

// Words to fully capitalize in formatName
const acronyms = {
  '3g': '3G',
  '4g': '4G',
  '5g': '5G',
  '1x': '1X',
  '1 2x': '1.2X',
  '1 5x': '1.5X',
  '1 8x': '1.8X',
  '2x': '2X',
  '5x': '5X',
  '3d': '3D',
  'ltr': 'LTR',
  'rtl': 'RTL',
  'usb': 'USB',
  'vip': 'VIP',
  'midi': 'MIDI',
  'cs': 'CS',
  'fs': 'FS',
  'js': 'JS',
  'py': 'PY',
  'rb': 'RB',
  'ts': 'TS',
  'vb': 'VB',
  'yml': 'YML',
  'sass': 'SASS',
  'pdf': 'PDF',
  'csv': 'CSV',
  'https': 'HTTPS',
  'iq': 'IQ',
  'eq': 'EQ',
  'vr': 'VR'
};

// Helper: recursively find all SVG files
function findSvgFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findSvgFiles(filePath));
    } else if (file.endsWith('.svg')) {
      results.push({
        path: filePath,
        filename: file
      });
    }
  }
  return results;
}

// Helper: parse style from filename
function getStyleFromFilename(filename) {
  if (filename.endsWith('_filled.svg')) return 'filled';
  if (filename.endsWith('_regular.svg')) return 'regular';
  if (filename.endsWith('_color.svg')) return 'color';
  return 'other';
}

function formatName(baseName) {
  // Convert underscores to spaces, capitalize first letter of each word
  let formatted = baseName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Post-process acronyms/special cases
  for (const [lower, upper] of Object.entries(acronyms)) {
    const regex = new RegExp(`\\b${lower}\\b`, 'gi');
    formatted = formatted.replace(regex, upper);
  }

  return formatted;
}

function syncIcons() {
  // 1. Ensure Microsoft Fluent Icons repository is available
  if (!fs.existsSync(microsoftIconsDir)) {
    console.log('Microsoft Fluent Icons directory not found.');
    console.log('Cloning Microsoft Fluent Icons repository (this might take a few minutes)...');
    try {
      execSync(`git clone --depth 1 "https://github.com/microsoft/fluentui-system-icons.git" "${microsoftIconsDir}"`, { stdio: 'inherit' });
      console.log('Clone complete.\n');
    } catch (error) {
      console.error('Failed to clone repository:', error);
      process.exit(1);
    }
  }

  // 2. Scan local folders
  console.log('Scanning local icon folders...');
  const userIcons = {
    filled: new Set(),
    regular: new Set(),
    color: new Set(),
    other: new Set()
  };

  for (const [style, dir] of Object.entries(userDirs)) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.svg')) {
          userIcons[style].add(file);
        }
      }
    }
  }

  // 3. Scan Microsoft repository
  console.log('Scanning Microsoft Fluent Icons repository...');
  const msSvgs = findSvgFiles(microsoftIconsDir);
  console.log(`Found ${msSvgs.length} total SVGs in Microsoft repo.`);

  const missing = {
    filled: [],
    regular: [],
    color: [],
    other: []
  };

  let totalMissing = 0;

  for (const svg of msSvgs) {
    const filename = svg.filename;
    const style = getStyleFromFilename(filename);

    if (style === 'other') {
      const foundInFilled = userIcons.filled.has(filename);
      const foundInRegular = userIcons.regular.has(filename);
      const foundInColor = userIcons.color.has(filename);
      if (!foundInFilled && !foundInRegular && !foundInColor) {
        missing.other.push({
          filename,
          msPath: path.relative(microsoftIconsDir, svg.path)
        });
        totalMissing++;
      }
    } else {
      if (!userIcons[style].has(filename)) {
        missing[style].push({
          filename,
          msPath: path.relative(microsoftIconsDir, svg.path)
        });
        totalMissing++;
      }
    }
  }

  console.log(`\nScan complete!`);
  console.log(`Total missing icons: ${totalMissing}`);
  console.log(`  - Filled: ${missing.filled.length}`);
  console.log(`  - Regular: ${missing.regular.length}`);
  console.log(`  - Color: ${missing.color.length}`);
  console.log(`  - Other: ${missing.other.length}`);

  // 4. Copy missing icons (Filled and Regular)
  const successfulFilled = [];
  const successfulRegular = [];

  if (missing.filled.length > 0 || missing.regular.length > 0) {
    console.log('\nCopying missing icons...');
    
    if (missing.filled.length > 0) {
      if (!fs.existsSync(userDirs.filled)) {
        fs.mkdirSync(userDirs.filled, { recursive: true });
      }
      for (const icon of missing.filled) {
        const srcPath = path.join(microsoftIconsDir, icon.msPath);
        const destPath = path.join(userDirs.filled, icon.filename);
        try {
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            successfulFilled.push(icon.filename);
          }
        } catch (err) {
          console.error(`Failed to copy ${icon.filename}:`, err);
        }
      }
    }

    if (missing.regular.length > 0) {
      if (!fs.existsSync(userDirs.regular)) {
        fs.mkdirSync(userDirs.regular, { recursive: true });
      }
      for (const icon of missing.regular) {
        const srcPath = path.join(microsoftIconsDir, icon.msPath);
        const destPath = path.join(userDirs.regular, icon.filename);
        try {
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            successfulRegular.push(icon.filename);
          }
        } catch (err) {
          console.error(`Failed to copy ${icon.filename}:`, err);
        }
      }
    }

    console.log(`Successfully copied:`);
    console.log(`  - Filled icons: ${successfulFilled.length} files`);
    console.log(`  - Regular icons: ${successfulRegular.length} files`);
    console.log(`  - Total: ${successfulFilled.length + successfulRegular.length} files`);
  } else {
    console.log('\nNo new icons to copy.');
  }

  // 5. Generate metadata
  console.log('\nGenerating icon metadata from local files...');
  const iconMap = new Map();

  for (const [style, dir] of Object.entries(userDirs)) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith('.svg')) continue;

      const filenameWithoutExt = file.replace(/\.svg$/, '');
      const match = filenameWithoutExt.match(/^ic_fluent_(.+)_(\d+)_(regular|filled|color)$/);
      
      if (!match) continue;

      const base = match[1];
      const size = match[2];

      if (!iconMap.has(base)) {
        iconMap.set(base, {
          name: formatName(base),
          regular: {},
          filled: {},
          color: {}
        });
      }

      const iconData = iconMap.get(base);
      iconData[style][size] = filenameWithoutExt;
    }
  }

  const sortedIcons = Array.from(iconMap.values()).sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  const metadataOutput = {
    icons: sortedIcons
  };

  if (!fs.existsSync(path.dirname(metadataPath))) {
    fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  }
  fs.writeFileSync(metadataPath, JSON.stringify(metadataOutput, null, 2), 'utf-8');
  console.log(`Metadata generation complete!`);
  console.log(`Total unique concept icons: ${sortedIcons.length}`);
  console.log(`Saved to: ${metadataPath}`);

  // 6. Generate/Update URL mapping
  console.log('\nUpdating icon_url.json mapping...');
  const activeNames = new Set(sortedIcons.map(icon => icon.name));
  const existingMap = new Map();

  if (fs.existsSync(iconUrlPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(iconUrlPath, 'utf-8'));
      if (Array.isArray(existingData)) {
        for (const entry of existingData) {
          if (entry.name && entry.id) {
            existingMap.set(entry.name, entry.id);
          }
        }
      }
    } catch (err) {
      console.warn('Warning: Could not parse existing icon_url.json, will regenerate IDs.', err);
    }
  }

  const updatedList = [];
  const activeNamesArray = Array.from(activeNames).sort((a, b) => a.localeCompare(b));

  for (const name of activeNamesArray) {
    let id;
    if (existingMap.has(name)) {
      id = existingMap.get(name);
    } else {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      id = `${slug}-${randomNum}`;
    }
    updatedList.push({ name, id });
  }

  if (!fs.existsSync(path.dirname(iconUrlPath))) {
    fs.mkdirSync(path.dirname(iconUrlPath), { recursive: true });
  }
  fs.writeFileSync(iconUrlPath, JSON.stringify(updatedList, null, 4), 'utf-8');
  console.log(`URL mapping updated successfully!`);
  console.log(`Total URLs in map: ${updatedList.length} (Added ${updatedList.length - existingMap.size} new entries)`);
  console.log(`Saved to: ${iconUrlPath}`);

  // 7. Write new icons JSON and update HomePage.tsx if new icons were copied
  const totalCopied = successfulFilled.length + successfulRegular.length;
  if (totalCopied > 0) {
    console.log('\nProcessing new icons for homepage display...');
    const newIconsMap = new Map();
    const allCopied = [
      ...successfulFilled.map(f => ({ filename: f, style: 'filled' })),
      ...successfulRegular.map(f => ({ filename: f, style: 'regular' }))
    ];

    for (const item of allCopied) {
      const filenameWithoutExt = item.filename.replace(/\.svg$/, '');
      const match = filenameWithoutExt.match(/^ic_fluent_(.+)_(\d+)_(regular|filled|color)$/);
      if (!match) continue;

      const base = match[1];
      const size = match[2];
      const style = item.style;

      if (!newIconsMap.has(base)) {
        newIconsMap.set(base, {
          name: formatName(base),
          regular: {},
          filled: {},
          color: {}
        });
      }

      const iconData = newIconsMap.get(base);
      iconData[style][size] = filenameWithoutExt;
    }

    const newIconsList = Array.from(newIconsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    if (!fs.existsSync(path.dirname(newIconsPath))) {
      fs.mkdirSync(path.dirname(newIconsPath), { recursive: true });
    }
    fs.writeFileSync(newIconsPath, JSON.stringify(newIconsList, null, 2), 'utf-8');
    console.log(`Saved new icons list to: ${newIconsPath}`);

    // Update HomePage.tsx
    if (fs.existsSync(homePagePath)) {
      console.log('Updating HomePage.tsx with new version and statistics...');
      let homePageContent = fs.readFileSync(homePagePath, 'utf-8');

      // Update version in STATS & Badge
      const versionMatch = homePageContent.match(/label:\s*"Version",\s*value:\s*"([^"]+)"/);
      if (versionMatch) {
        const currentVersion = versionMatch[1];
        const parts = currentVersion.split('.').map(Number);
        parts[2] = (parts[2] || 0) + 1; // Increment patch version
        const nextVersion = parts.join('.');

        // Replace version in STATS
        homePageContent = homePageContent.replace(
          new RegExp(`(label:\\s*"Version",\\s*value:\\s*")` + currentVersion.replace(/\./g, '\\.') + `(")`),
          `$1${nextVersion}$2`
        );

        // Replace version in "New in v..." badge
        homePageContent = homePageContent.replace(
          new RegExp(`(New in v)` + currentVersion.replace(/\./g, '\\.')),
          `$1${nextVersion}`
        );
        console.log(`Incremented home page version: v${currentVersion} -> v${nextVersion}`);
      }

      // Update bringing X new variations and Y entirely new icon categories
      homePageContent = homePageContent.replace(
        /bringing <strong>\d+ new variations<\/strong> and <strong>\d+ entirely new icon categories<\/strong>/g,
        `bringing <strong>${totalCopied} new variations</strong> and <strong>${newIconsMap.size} entirely new icon categories</strong>`
      );

      // Update total local SVGs count in System Icons card count
      let totalLocalSvgs = 0;
      for (const dir of Object.values(userDirs)) {
        if (fs.existsSync(dir)) {
          totalLocalSvgs += fs.readdirSync(dir).filter(f => f.endsWith('.svg')).length;
        }
      }

      homePageContent = homePageContent.replace(
        /(icon:\s*'FluentIconsIcon'[\s\S]*?count:\s*)\d+/,
        `$1${totalLocalSvgs}`
      );

      // Update Explore All X+ button
      homePageContent = homePageContent.replace(
        /Explore All [\d,]+\+ Icons/g,
        `Explore All ${sortedIcons.length.toLocaleString()}+ Icons`
      );

      fs.writeFileSync(homePagePath, homePageContent, 'utf-8');
      console.log('HomePage.tsx successfully updated!');
    }
  } else {
    console.log('\nNo new icons were copied; skipping homepage and new_icons.json updates.');
  }
}

syncIcons();
