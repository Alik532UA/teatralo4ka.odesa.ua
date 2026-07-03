import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const SITE_URL = 'https://teatralo4ka.odesa.ua';
const PAGES_DIR = path.join(process.cwd(), 'src/lib/i18n/pages');

function generateSitemap() {
  const entries: string[] = [];
  const langs = ['uk', 'en'];

  langs.forEach(lang => {
    const langPrefix = lang === 'uk' ? '' : `/${lang}`;
    entries.push(`
  <url>
    <loc>${SITE_URL}${langPrefix}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`);
  });

  langs.forEach(lang => {
    const langDir = path.join(PAGES_DIR, lang);
    if (!fs.existsSync(langDir)) return;

    const files = fs.readdirSync(langDir).filter((f: string) => f.endsWith('.md'));

    files.forEach((file: string) => {
      const filePath = path.join(langDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);

      if (data.status !== 'published') return;

      const slug = file.replace('.md', '');
      const langPrefix = lang === 'uk' ? '' : `/${lang}`;
      const urlPath = `${langPrefix}/${slug}`;

      entries.push(`
  <url>
    <loc>${SITE_URL}${urlPath}</loc>
    <lastmod>${data.lastModified || data.date || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${data.changefreq || 'monthly'}</changefreq>
    <priority>${data.priority || 0.8}</priority>
  </url>`);
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('')}
</urlset>`;

  const outputPath = path.join(process.cwd(), 'static', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml);
  console.log(`✅ Sitemap generated at ${outputPath}`);
}

generateSitemap();
