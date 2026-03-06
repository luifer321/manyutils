#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const OUT      = path.join(ROOT, 'dist');
const BASE_URL = 'https://manyutils.com';

const ALL_LANGS   = ['en', 'fr', 'es', 'de', 'pt'];
const EXTRA_LANGS = ALL_LANGS.filter(l => l !== 'en');

const TOOL_IDS = [
  'qr-code-generator',
  'json-formatter',
  'password-generator',
  'uuid-generator',
  'image-pixelator',
  'image-compressor',
  'css-gradient-generator',
  'color-palette-generator',
  'base64-encoder-decoder',
  'currency-converter',
  'word-character-counter',
  'days-between-dates',
];

const POPULAR_TOOL_IDS = new Set([
  'json-formatter', 'qr-code-generator', 'password-generator',
  'base64-encoder-decoder', 'uuid-generator', 'image-compressor',
]);

// "Free online" suffix in each non-English language, used to build page titles
const TITLE_FREE = {
  fr: 'Gratuit en Ligne',
  es: 'Gratis en Línea',
  de: 'Kostenlos Online',
  pt: 'Grátis Online',
};

// ─── File helpers ─────────────────────────────────────────────────────────────

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true });
      else fs.unlinkSync(p);
    });
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(f => {
    const s = path.join(src, f), d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function writeFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

/** Escape only chars that are unsafe inside HTML attribute values or element text. */
function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Convert a tool-id slug ("json-formatter") to locale object key ("json_formatter"). */
function toLocaleKey(toolId) {
  return toolId.replace(/-/g, '_');
}

function loadLocale(lang) {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, 'locales', `${lang}.json`), 'utf8'),
  );
}

// ─── hreflang block ───────────────────────────────────────────────────────────

/**
 * Build a block of <link rel="alternate"> hreflang tags for a given canonical
 * English path (e.g. "/tools/json-formatter/" or "/").
 */
function hreflangBlock(enPath) {
  const lines = [
    `  <link rel="alternate" hreflang="en"        href="${BASE_URL}${enPath}">`,
  ];
  for (const lang of EXTRA_LANGS) {
    const langPath = lang === 'en' ? enPath : `/${lang}${enPath}`;
    lines.push(
      `  <link rel="alternate" hreflang="${lang}"        href="${BASE_URL}${langPath}">`,
    );
  }
  lines.push(
    `  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${enPath}">`,
  );
  return lines.join('\n');
}

// ─── Static SEO section renderer ──────────────────────────────────────────────

/**
 * Mirrors the renderSeoSection() logic in app.js but produces a static HTML
 * string that can be embedded directly in the page's source.
 */
function renderSeoSection(locale, localeKey) {
  const seo      = locale.tools?.[localeKey]?.seo;
  if (!seo) return '';

  const toolName = locale.tools[localeKey].name || '';
  const whatIs   = locale.common?.what_is    || 'What is';
  const howTo    = locale.common?.how_to_use || 'How to Use';
  const faqLabel = locale.common?.faq        || 'Frequently Asked Questions';

  let html = '';

  if (seo.intro) {
    html += `
        <div class="mb-8">
          <h2 class="text-xl font-bold text-slate-900 mb-3">${escAttr(whatIs)} ${escAttr(toolName)}?</h2>
          <p class="text-slate-600 leading-relaxed">${seo.intro}</p>
        </div>`;
  }

  if (Array.isArray(seo.steps) && seo.steps.length) {
    const items = seo.steps.map(s => `<li class="pl-1">${s}</li>`).join('\n          ');
    html += `
        <div class="mb-8">
          <h2 class="text-xl font-bold text-slate-900 mb-3">${escAttr(howTo)} ${escAttr(toolName)}</h2>
          <ol class="list-decimal list-inside text-slate-600 space-y-2 leading-relaxed">
          ${items}
          </ol>
        </div>`;
  }

  if (Array.isArray(seo.faq) && seo.faq.length) {
    const chevron = `<svg class="faq-chevron w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>`;
    const items = seo.faq.map((item, i) => `
          <div class="faq-item border border-slate-200 rounded-xl overflow-hidden${i === 0 ? ' active' : ''}">
            <button class="faq-question w-full flex items-center justify-between p-4 text-left font-medium text-slate-900 hover:bg-slate-50">
              <span>${escAttr(item.q)}</span>
              ${chevron}
            </button>
            <div class="faq-answer px-4 text-slate-600"><p class="pb-2">${item.a}</p></div>
          </div>`).join('');

    html += `
        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-4">${escAttr(faqLabel)}</h2>
          <div class="space-y-3">${items}
          </div>
        </div>`;
  }

  return html;
}

// ─── Per-page transformers ────────────────────────────────────────────────────

/**
 * Add hreflang tags to an English page (after its canonical link).
 * Also pre-renders the SEO section for the English locale.
 */
function processEnglishToolPage(html, toolId, enLocale) {
  const enPath       = `/tools/${toolId}/`;
  const localeKey    = toLocaleKey(toolId);
  const seoHtml      = renderSeoSection(enLocale, localeKey);

  let result = html;

  // 1. Inject hreflang block after canonical
  result = result.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflangBlock(enPath)}`,
  );

  // 2. Pre-render SEO section so it's visible before JS runs
  if (seoHtml) {
    result = result.replace(
      '<div id="seo-content"></div>',
      `<div id="seo-content">${seoHtml}\n        </div>`,
    );
  }

  return result;
}

/**
 * Transform an English tool page's HTML into a fully localised version for
 * the given language. Handles:
 *  - <html lang>
 *  - <title>, meta description
 *  - canonical URL
 *  - hreflang block
 *  - og: and twitter: meta tags
 *  - WebApplication JSON-LD (name, url, description)
 *  - H1 and description paragraph text (pre-rendered)
 *  - SEO content section (pre-rendered)
 */
function transformToolPage(html, lang, locale, toolId) {
  const localeKey = toLocaleKey(toolId);
  const toolData  = locale.tools?.[localeKey];
  if (!toolData) return html;

  const toolName  = toolData.name;
  const toolDesc  = toolData.description;
  const enPath    = `/tools/${toolId}/`;
  const langPath  = `/${lang}${enPath}`;
  const canonUrl  = `${BASE_URL}${langPath}`;
  const pageTitle = `${toolName} — ${TITLE_FREE[lang]} | ManyUtils`;
  const seoHtml   = renderSeoSection(locale, localeKey);

  let result = html;

  // lang attribute
  result = result.replace(/(<html[^>]*)lang="en"/, `$1lang="${lang}"`);

  // <title>
  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escAttr(pageTitle)}</title>`,
  );

  // meta description
  result = result.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${escAttr(toolDesc)}$2`,
  );

  // canonical
  result = result.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${canonUrl}$2`,
  );

  // hreflang block (after canonical)
  result = result.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflangBlock(enPath)}`,
  );

  // og:title
  result = result.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${escAttr(pageTitle)}$2`,
  );

  // og:description
  result = result.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${escAttr(toolDesc)}$2`,
  );

  // og:url
  result = result.replace(
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${canonUrl}$2`,
  );

  // twitter:title
  result = result.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${escAttr(pageTitle)}$2`,
  );

  // twitter:description
  result = result.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${escAttr(toolDesc)}$2`,
  );

  // WebApplication JSON-LD — parse, update, re-embed
  result = result.replace(
    /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,
    (match, open, jsonStr, close) => {
      try {
        const data = JSON.parse(jsonStr.trim());
        data.name        = toolName;
        data.url         = canonUrl;
        data.description = toolDesc;
        return `${open}\n  ${JSON.stringify(data, null, 2)}\n  ${close}`;
      } catch (_) {
        return match;
      }
    },
  );

  // Pre-render H1 text (data-i18n="tools.*.name")
  result = result.replace(
    /(<h1[^>]*data-i18n="tools\.[^"]+\.name"[^>]*>)[^<]*(<\/h1>)/,
    `$1${toolName}$2`,
  );

  // Pre-render description <p> (data-i18n="tools.*.description")
  result = result.replace(
    /(<p[^>]*data-i18n="tools\.[^"]+\.description"[^>]*>)[^<]*(<\/p>)/,
    `$1${toolDesc}$2`,
  );

  // Pre-render SEO content section
  if (seoHtml) {
    result = result.replace(
      '<div id="seo-content"></div>',
      `<div id="seo-content">${seoHtml}\n        </div>`,
    );
  }

  return result;
}

/**
 * Add hreflang to English homepage and pre-render hero text.
 */
function processEnglishHomePage(html, enLocale) {
  let result = html;

  result = result.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflangBlock('/')}`,
  );

  return result;
}

/**
 * Transform the homepage for a non-English language.
 */
function transformHomePage(html, lang, locale) {
  const enPath    = '/';
  const langPath  = `/${lang}/`;
  const canonUrl  = `${BASE_URL}${langPath}`;
  const heroT1    = locale.common?.hero_title_1 || '';
  const heroT2    = locale.common?.hero_title_2 || '';
  const heroSub   = locale.common?.hero_subtitle || '';
  const tagline   = locale.common?.footer_tagline || '';
  const pageTitle = `ManyUtils — ${heroT1} ${heroT2}`.replace(/\s+/g, ' ').trim();

  let result = html;

  result = result.replace(/(<html[^>]*)lang="en"/, `$1lang="${lang}"`);

  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escAttr(pageTitle)}</title>`,
  );

  result = result.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${escAttr(tagline)}$2`,
  );

  result = result.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${canonUrl}$2`,
  );

  result = result.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflangBlock(enPath)}`,
  );

  result = result.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${escAttr(pageTitle)}$2`,
  );

  result = result.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${escAttr(tagline)}$2`,
  );

  result = result.replace(
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${canonUrl}$2`,
  );

  result = result.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${escAttr(pageTitle)}$2`,
  );

  result = result.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${escAttr(tagline)}$2`,
  );

  // Pre-render hero text so Google's first-wave crawl sees translated copy
  if (heroT1) {
    result = result.replace(
      /(<span[^>]*data-i18n="common\.hero_title_1"[^>]*>)[^<]*(<\/span>)/,
      `$1${heroT1}$2`,
    );
  }
  if (heroT2) {
    result = result.replace(
      /(<span[^>]*data-i18n="common\.hero_title_2"[^>]*>)[^<]*(<\/span>)/,
      `$1${heroT2}$2`,
    );
  }
  if (heroSub) {
    result = result.replace(
      /(<p[^>]*data-i18n="common\.hero_subtitle"[^>]*>)[^<]*(<\/p>)/,
      `$1${heroSub}$2`,
    );
  }

  return result;
}

// ─── Sitemap generator ────────────────────────────────────────────────────────

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  const entries = [];

  const addUrl = (loc, priority, changefreq) =>
    entries.push(
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    );

  // English homepage
  addUrl(`${BASE_URL}/`, '1.0', 'weekly');

  // Language homepages
  for (const lang of EXTRA_LANGS) {
    addUrl(`${BASE_URL}/${lang}/`, '0.9', 'weekly');
  }

  // English tool pages
  for (const id of TOOL_IDS) {
    addUrl(
      `${BASE_URL}/tools/${id}/`,
      POPULAR_TOOL_IDS.has(id) ? '0.9' : '0.8',
      'monthly',
    );
  }

  // Localised tool pages
  for (const lang of EXTRA_LANGS) {
    for (const id of TOOL_IDS) {
      addUrl(
        `${BASE_URL}/${lang}/tools/${id}/`,
        POPULAR_TOOL_IDS.has(id) ? '0.8' : '0.7',
        'monthly',
      );
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join('\n'),
    '</urlset>',
  ].join('\n');
}

// ─── Main build ───────────────────────────────────────────────────────────────

rmDir(OUT);
fs.mkdirSync(OUT, { recursive: true });

// Copy static assets (no transformation needed)
copyDir(path.join(ROOT, 'assets'),  path.join(OUT, 'assets'));
copyDir(path.join(ROOT, 'locales'), path.join(OUT, 'locales'));
copyFile(path.join(ROOT, 'robots.txt'), path.join(OUT, 'robots.txt'));
['privacy.html', 'terms.html'].forEach(f =>
  copyFile(path.join(ROOT, f), path.join(OUT, f)),
);

// Load all locales
const locales = {};
for (const lang of ALL_LANGS) {
  locales[lang] = loadLocale(lang);
}

// ── English homepage ──────────────────────────────────────────────────────────
const homeHtmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
writeFile(
  path.join(OUT, 'index.html'),
  processEnglishHomePage(homeHtmlSrc, locales.en),
);

// ── English tool pages ────────────────────────────────────────────────────────
for (const toolId of TOOL_IDS) {
  const srcFile = path.join(ROOT, 'tools', toolId, 'index.html');
  if (!fs.existsSync(srcFile)) continue;

  const html = fs.readFileSync(srcFile, 'utf8');
  writeFile(
    path.join(OUT, 'tools', toolId, 'index.html'),
    processEnglishToolPage(html, toolId, locales.en),
  );
}

// ── Language variants ─────────────────────────────────────────────────────────
for (const lang of EXTRA_LANGS) {
  const locale = locales[lang];

  // Language homepage
  writeFile(
    path.join(OUT, lang, 'index.html'),
    transformHomePage(homeHtmlSrc, lang, locale),
  );

  // Language tool pages
  for (const toolId of TOOL_IDS) {
    const srcFile = path.join(ROOT, 'tools', toolId, 'index.html');
    if (!fs.existsSync(srcFile)) continue;

    const html = fs.readFileSync(srcFile, 'utf8');
    writeFile(
      path.join(OUT, lang, 'tools', toolId, 'index.html'),
      transformToolPage(html, lang, locale, toolId),
    );
  }
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
const sitemap = generateSitemap();
writeFile(path.join(OUT, 'sitemap.xml'), sitemap);
writeFile(path.join(ROOT, 'sitemap.xml'), sitemap); // keep source in sync

// ── Summary ───────────────────────────────────────────────────────────────────
const totalPages = 1 + TOOL_IDS.length + EXTRA_LANGS.length * (1 + TOOL_IDS.length);
console.log('Static site built to dist/');
console.log(`  English   : 1 homepage + ${TOOL_IDS.length} tool pages`);
console.log(`  Languages : ${EXTRA_LANGS.join(', ')} (${EXTRA_LANGS.length} × ${1 + TOOL_IDS.length} pages each)`);
console.log(`  Total     : ${totalPages} HTML pages`);
