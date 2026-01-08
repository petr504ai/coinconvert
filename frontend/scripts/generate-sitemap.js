/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeBaseUrl(url) {
  return String(url || 'https://coinconvert.ru').replace(/\/+$/, '');
}

function buildUrl(baseUrl, pathname) {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${p}`;
}

function tryReadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function validateArticles(articles) {
  if (!Array.isArray(articles)) {
    throw new Error('[sitemap] articles.json must be an array');
  }

  const seen = new Set();
  const errors = [];

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!a || typeof a !== 'object') {
      errors.push(`Article #${i + 1}: must be an object`);
      continue;
    }

    const label = a.title ? `"${a.title}"` : `#${i + 1}`;
    const slug = a.slug;

    if (!isValidSlug(slug)) {
      errors.push(`Article ${label}: invalid slug "${slug}". Expected kebab-case: ^[a-z0-9]+(?:-[a-z0-9]+)*$`);
    } else {
      if (seen.has(slug)) {
        errors.push(`Article ${label}: duplicate slug "${slug}"`);
      }
      seen.add(slug);
    }

    if (a.date != null && !isIsoDate(a.date)) {
      errors.push(`Article ${label}: invalid date "${a.date}". Expected YYYY-MM-DD`);
    }
  }

  if (errors.length) {
    throw new Error(`[sitemap] Invalid articles.json:\n- ${errors.join('\n- ')}`);
  }
}

function getLatestArticleDate(articles) {
  if (!Array.isArray(articles)) return undefined;

  const dates = articles
    .map((a) => a && a.date)
    .filter((d) => isIsoDate(d));

  if (dates.length === 0) return undefined;

  // ISO YYYY-MM-DD can be compared lexicographically.
  dates.sort();
  return dates[dates.length - 1];
}

function generateSitemapXml({ baseUrl, urls }) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  const open = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const close = `</urlset>\n`;

  const body = urls
    .map((u) => {
      const loc = `<loc>${xmlEscape(u.loc)}</loc>`;
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : '';
      const changefreq = u.changefreq ? `<changefreq>${xmlEscape(u.changefreq)}</changefreq>` : '';
      const priority = typeof u.priority === 'number' ? `<priority>${u.priority.toFixed(1)}</priority>` : '';

      return `  <url>\n    ${loc}${lastmod ? `\n    ${lastmod}` : ''}${changefreq ? `\n    ${changefreq}` : ''}${priority ? `\n    ${priority}` : ''}\n  </url>`;
    })
    .join('\n');

  return header + open + body + '\n' + close;
}

function main() {
  const baseUrl = normalizeBaseUrl(process.env.SITE_URL);

  const articlesJsonPath = path.join(__dirname, '..', 'src', 'data', 'articles.json');
  const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

  const articles = tryReadJson(articlesJsonPath);
  validateArticles(articles);
  const latestDate = getLatestArticleDate(articles);

  const urls = [];

  // Main landing
  urls.push({
    loc: buildUrl(baseUrl, '/'),
    lastmod: latestDate,
    changefreq: 'daily',
    priority: 1.0
  });

  // Blog index
  urls.push({
    loc: buildUrl(baseUrl, '/blog'),
    lastmod: latestDate,
    changefreq: 'weekly',
    priority: 0.7
  });

  // Articles
  for (const a of articles) {
    if (!a || !a.slug) continue;

    urls.push({
      loc: buildUrl(baseUrl, `/blog/${a.slug}`),
      lastmod: isIsoDate(a.date) ? a.date : undefined,
      changefreq: 'monthly',
      priority: 0.6
    });
  }

  const xml = generateSitemapXml({ baseUrl, urls });
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`[sitemap] Wrote ${urls.length} urls -> ${outPath}`);
}

main();
