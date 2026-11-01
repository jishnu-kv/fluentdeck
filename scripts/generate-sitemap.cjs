const fs = require("fs");
const path = require("path");

const baseUrl = "https://fluentdeck.vercel.app";
const lastModifiedDate = new Date().toISOString();

const pages = [
  { url: `${baseUrl}/`, priority: 1.0, changeFreq: "weekly" },
  { url: `${baseUrl}/apps`, priority: 0.9, changeFreq: "monthly" },
  { url: `${baseUrl}/emoji`, priority: 0.8, changeFreq: "monthly" },
  { url: `${baseUrl}/icons`, priority: 0.8, changeFreq: "monthly" },
  { url: `${baseUrl}/changelog`, priority: 0.6, changeFreq: "monthly" },
  { url: `${baseUrl}/contribute`, priority: 0.5, changeFreq: "yearly" }
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `
  <url>
    <loc>${p.url}</loc>
    <lastmod>${lastModifiedDate}</lastmod>
    <changefreq>${p.changeFreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("")}
</urlset>
`;

const outputPath = path.join(__dirname, "../public/sitemap.xml");
fs.writeFileSync(outputPath, xml.trim());

const distPath = path.join(__dirname, "../dist/sitemap.xml");
if (fs.existsSync(path.dirname(distPath))) {
  fs.writeFileSync(distPath, xml.trim());
}

console.log("✓ Sitemap generated:", outputPath);
