// scripts/generate-contributors.cjs
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OUTPUT_PATH = path.resolve('./public/data/contributors.json');
const AVATAR_DIR = path.resolve('./public/assets/contributors');
const API_URL = 'https://api.github.com/repos/jishnu-kv/WinUI-Apps-List/contributors?per_page=100';

// Util: ensure dir
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Util: concurrency queue
async function runWithConcurrencyLimit(tasks, limit = 5) {
  const results = [];
  const queue = [...tasks];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const task = queue.shift();
      try {
        const result = await task();
        results.push(result);
      } catch (err) {
        console.warn('! Task failed:', err.message);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

// Util: image downloader
async function downloadAndConvertAvatar(url, filename) {
  const outputPath = path.join(AVATAR_DIR, `${filename}.webp`);
  if (fs.existsSync(outputPath)) return `/assets/contributors/${filename}.webp`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await sharp(buffer).resize(128, 128).webp({ quality: 80 }).toFile(outputPath);
    return `/assets/contributors/${filename}.webp`;
  } catch (err) {
    console.warn(`! Failed for ${filename}: ${err.message}`);
    return url;
  }
}

// Main
async function generateContributors() {
  console.log('Fetching contributors from GitHub...');
  ensureDir(AVATAR_DIR);
  const existing = fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
    : [];
  const existingLogins = new Set(existing.map((c) => c.login.toLowerCase()));
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const apiData = await res.json();
  const newContributors = apiData.filter((c) => c.type === 'User' && !existingLogins.has(c.login.toLowerCase()));
  console.log(`+ Found ${newContributors.length} new contributors.`);
  const tasks = newContributors.map((c) => async () => {
    const filename = c.login.toLowerCase().toLowerCase();
    const localPath = await downloadAndConvertAvatar(c.avatar_url, filename);
    return {
      login: c.login.toLowerCase(),
      html_url: c.html_url,
      avatar_url: localPath,
      id: c.id,
    };
  });
  const results = await runWithConcurrencyLimit(tasks, 5);
  const updated = [...existing, ...results];
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
  console.log(`✓ Contributors updated: ${updated.length} total`);
}
generateContributors().catch((err) => console.error('[x] Failed:', err));