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
  // Existing
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
  // Image converters (PNG / JPG / WEBP / SVG matrix)
  'png-to-jpg',
  'jpg-to-png',
  'png-to-webp',
  'webp-to-png',
  'webp-to-jpg',
  'jpg-to-webp',
  'svg-to-png',
  'svg-to-jpg',
  'svg-to-webp',
  // Image manipulation
  'image-resizer',
  'crop-image',
  'rotate-flip-image',
  // Media (video)
  'video-to-gif',
  // Audio
  'audio-cutter',
  'volume-changer',
  'audio-speed-changer',
  'audio-to-wav',
  'mp3-metadata-viewer',
];

const POPULAR_TOOL_IDS = new Set([
  'json-formatter', 'qr-code-generator', 'password-generator',
  'base64-encoder-decoder', 'uuid-generator', 'image-compressor',
  'png-to-jpg', 'jpg-to-png', 'image-resizer', 'video-to-gif', 'audio-cutter',
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

// ─── Favicon injection ───────────────────────────────────────────────────────

const FAVICON_LINKS = [
  '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">',
  '<link rel="alternate icon" href="/assets/favicon.svg">',
  '<link rel="apple-touch-icon" href="/assets/favicon.svg">',
  '<link rel="mask-icon" href="/assets/favicon.svg" color="#6366f1">',
  '<meta name="theme-color" content="#6366f1">',
].join('\n  ');

/** Inject favicon + theme-color tags after the viewport meta if not already present. */
function injectFavicon(html) {
  if (html.includes('rel="icon"')) return html;
  return html.replace(
    /(<meta name="viewport"[^>]*>)/,
    `$1\n  ${FAVICON_LINKS}`,
  );
}

// ─── Generic build-time i18n resolver ────────────────────────────────────────

/** Walk a dotted key (e.g. "home.why.title") through a locale object. */
function lookupKey(locale, key) {
  return key.split('.').reduce(
    (acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined),
    locale,
  );
}

/**
 * Pre-render translations directly into the HTML.
 *
 * Looks for any element carrying one of these attributes and rewrites the
 * matching attribute/content from the given locale:
 *
 *   data-i18n="key"             → element text (HTML-escaped)
 *   data-i18n-html="key"        → element inner HTML (raw)
 *   data-i18n-placeholder="key" → placeholder=""  attribute
 *   data-i18n-title="key"       → title=""        attribute
 *   data-i18n-aria-label="key"  → aria-label=""   attribute
 *
 * Limitations:
 *   - For data-i18n / data-i18n-html the regex assumes the element does NOT
 *     contain another tag of the same name (no <div data-i18n><div>…</div></div>).
 *     In practice we put data-i18n on leaf elements (h1, h2, p, span, button,
 *     option, li), so this holds.
 *   - Missing keys leave the source HTML untouched. The runtime translator
 *     will still try to fill them on language switch.
 */
function applyI18nToHtml(html, locale) {
  if (!locale) return html;

  // 1. data-i18n="key" → text content
  html = html.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\sdata-i18n="([^"]+)"([^>]*?)>([\s\S]*?)<\/\1>/g,
    (match, tag, before, key, after, _inner) => {
      const t = lookupKey(locale, key);
      if (typeof t !== 'string') return match;
      return `<${tag}${before} data-i18n="${key}"${after}>${escAttr(t)}</${tag}>`;
    },
  );

  // 2. data-i18n-html="key" → raw inner HTML
  html = html.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\sdata-i18n-html="([^"]+)"([^>]*?)>([\s\S]*?)<\/\1>/g,
    (match, tag, before, key, after, _inner) => {
      const t = lookupKey(locale, key);
      if (typeof t !== 'string') return match;
      return `<${tag}${before} data-i18n-html="${key}"${after}>${t}</${tag}>`;
    },
  );

  // 3 / 4 / 5. attribute-based variants (placeholder, title, aria-label) — operate
  // on the open tag only so we don't touch anything between < and >.
  const attrRules = [
    { marker: 'data-i18n-placeholder', target: 'placeholder' },
    { marker: 'data-i18n-title',       target: 'title' },
    { marker: 'data-i18n-aria-label',  target: 'aria-label' },
    { marker: 'data-i18n-content',     target: 'content' },
  ];

  for (const { marker, target } of attrRules) {
    const re = new RegExp(
      `<([a-zA-Z][a-zA-Z0-9]*)([^>]*?\\s${marker}="([^"]+)"[^>]*?)>`,
      'g',
    );
    html = html.replace(re, (match, tag, attrs, key) => {
      const t = lookupKey(locale, key);
      if (typeof t !== 'string') return match;
      const targetRe = new RegExp(`(\\s${target}=")[^"]*(")`);
      let newAttrs;
      if (targetRe.test(attrs)) {
        newAttrs = attrs.replace(targetRe, `$1${escAttr(t)}$2`);
      } else {
        // Insert the attribute right after the marker so it always exists.
        newAttrs = attrs.replace(
          new RegExp(`(\\s${marker}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}")`),
          `$1 ${target}="${escAttr(t)}"`,
        );
      }
      return `<${tag}${newAttrs}>`;
    });
  }

  return html;
}

// ─── hreflang block ───────────────────────────────────────────────────────────

/**
 * Build a block of <link rel="alternate"> hreflang tags for a given canonical
 * English path (e.g. "/json-formatter/" or "/").
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

/** Minimal HTML escaper for content inserted as text inside <pre> blocks. */
function escText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Mirrors the renderSeoSection() logic in app.js but produces a static HTML
 * string that can be embedded directly in the page's source.
 *
 * Supports the full extended schema:
 *   intro       string  – markup-safe HTML paragraph
 *   valueProps  [{ title, body }]
 *   steps       [string]
 *   examples    [{ title, input, output }]
 *   mistakes    [string]
 *   faq         [{ q, a }]
 */
function renderSeoSection(locale, localeKey) {
  const seo = locale.tools?.[localeKey]?.seo;
  if (!seo) return '';

  const toolName       = locale.tools[localeKey].name || '';
  const whatIs         = locale.common?.what_is         || 'What is';
  const howTo          = locale.common?.how_to_use      || 'How to use';
  const faqLabel       = locale.common?.faq             || 'Frequently Asked Questions';
  const whyLabel       = locale.common?.why_useful      || 'Why this tool is useful';
  const examplesLabel  = locale.common?.examples        || 'Example input and output';
  const mistakesLabel  = locale.common?.common_mistakes || 'Common mistakes to avoid';
  const ctaTitle       = locale.common?.cta_more_title  || 'Looking for more free tools?';
  const ctaBody        = locale.common?.cta_more_body   || 'ManyUtils has dozens of fast, privacy-friendly utilities for developers, designers, writers and everyday users. All free, all in your browser.';
  const ctaLink        = locale.common?.cta_more_link   || 'Browse all tools →';

  const out = [];

  if (seo.intro) {
    out.push(`
        <section class="mb-10" aria-labelledby="sec-what-is">
          <h2 id="sec-what-is" class="text-xl font-bold text-slate-900 mb-3">${escAttr(whatIs)} ${escAttr(toolName)}?</h2>
          <div class="text-slate-600 leading-relaxed space-y-3">${seo.intro}</div>
        </section>`);
  }

  if (Array.isArray(seo.valueProps) && seo.valueProps.length) {
    const cards = seo.valueProps.map(it => `
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 class="font-semibold text-slate-900 mb-1.5 text-sm">${escAttr(it.title)}</h3>
              <p class="text-sm text-slate-600 leading-relaxed">${it.body}</p>
            </div>`).join('');
    out.push(`
        <section class="mb-10" aria-labelledby="sec-why">
          <h2 id="sec-why" class="text-xl font-bold text-slate-900 mb-4">${escAttr(whyLabel)}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${cards}
          </div>
        </section>`);
  }

  if (Array.isArray(seo.steps) && seo.steps.length) {
    const items = seo.steps.map(s => `<li class="pl-1 leading-relaxed">${s}</li>`).join('\n          ');
    out.push(`
        <section class="mb-10" aria-labelledby="sec-how-to">
          <h2 id="sec-how-to" class="text-xl font-bold text-slate-900 mb-3">${escAttr(howTo)} ${escAttr(toolName)}</h2>
          <ol class="list-decimal list-inside text-slate-600 space-y-2">
          ${items}
          </ol>
        </section>`);
  }

  if (Array.isArray(seo.examples) && seo.examples.length) {
    const blocks = seo.examples.map(ex => `
            <div class="rounded-xl border border-slate-200 overflow-hidden">
              <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-800">${escAttr(ex.title)}</div>
              <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div>
                  <div class="px-4 pt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</div>
                  <pre class="px-4 pb-4 pt-1 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">${escText(ex.input || '')}</pre>
                </div>
                <div>
                  <div class="px-4 pt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Output</div>
                  <pre class="px-4 pb-4 pt-1 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">${escText(ex.output || '')}</pre>
                </div>
              </div>
            </div>`).join('');
    out.push(`
        <section class="mb-10" aria-labelledby="sec-examples">
          <h2 id="sec-examples" class="text-xl font-bold text-slate-900 mb-4">${escAttr(examplesLabel)}</h2>
          <div class="space-y-4">${blocks}
          </div>
        </section>`);
  }

  if (Array.isArray(seo.mistakes) && seo.mistakes.length) {
    const items = seo.mistakes.map(m => `
            <li class="flex items-start gap-3">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5">!</span>
              <span class="leading-relaxed">${m}</span>
            </li>`).join('');
    out.push(`
        <section class="mb-10" aria-labelledby="sec-mistakes">
          <h2 id="sec-mistakes" class="text-xl font-bold text-slate-900 mb-4">${escAttr(mistakesLabel)}</h2>
          <ul class="text-slate-600 space-y-2.5">${items}
          </ul>
        </section>`);
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
    out.push(`
        <section aria-labelledby="sec-faq">
          <h2 id="sec-faq" class="text-xl font-bold text-slate-900 mb-4">${escAttr(faqLabel)}</h2>
          <div class="space-y-3">${items}
          </div>
        </section>`);
  }

  // CTA – always rendered (cheap and helps with internal linking + UX).
  out.push(`
        <section class="mt-10 rounded-2xl bg-gradient-to-br from-primary-50 to-violet-50 border border-primary-100 p-6">
          <h2 class="text-lg font-bold text-slate-900 mb-1.5">${escAttr(ctaTitle)}</h2>
          <p class="text-slate-600 text-sm leading-relaxed mb-4">${escAttr(ctaBody)}</p>
          <a href="/" class="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-semibold text-sm">${escAttr(ctaLink)}</a>
        </section>`);

  return out.join('');
}

/** Build a JSON-LD <script> block (FAQPage + BreadcrumbList) for a tool page. */
function renderToolSchemas(toolName, canonicalUrl, faq) {
  const blocks = [];

  blocks.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${BASE_URL}/#tools` },
      { '@type': 'ListItem', position: 3, name: toolName, item: canonicalUrl },
    ],
  });

  if (Array.isArray(faq) && faq.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      })),
    });
  }

  return blocks
    .map(b => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`)
    .join('\n  ');
}

// ─── Per-page transformers ────────────────────────────────────────────────────

/**
 * Add hreflang tags to an English page (after its canonical link).
 * Also pre-renders the SEO section for the English locale.
 */
function processEnglishToolPage(html, toolId, enLocale) {
  const enPath    = `/${toolId}/`;
  const localeKey = toLocaleKey(toolId);
  const seoHtml   = renderSeoSection(enLocale, localeKey);
  const toolName  = enLocale.tools?.[localeKey]?.name || '';
  const faq       = enLocale.tools?.[localeKey]?.seo?.faq || [];
  const schemas   = renderToolSchemas(toolName, `${BASE_URL}${enPath}`, faq);

  let result = html;

  // 1. Inject hreflang block after canonical
  result = result.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflangBlock(enPath)}`,
  );

  // 2. Inject Breadcrumb + FAQ JSON-LD right before </head>
  result = result.replace(/<\/head>/, `  ${schemas}\n</head>`);

  // 3. Pre-render SEO section so it's visible before JS runs
  if (seoHtml) {
    result = result.replace(
      '<div id="seo-content"></div>',
      `<div id="seo-content">${seoHtml}\n        </div>`,
    );
  }

  // 4. Resolve any remaining data-i18n* attributes from the English locale.
  result = applyI18nToHtml(result, enLocale);

  // 5. Site-wide favicon + theme-color.
  result = injectFavicon(result);

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
  const enPath    = `/${toolId}/`;
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

  // Breadcrumb + FAQ JSON-LD
  const faq     = locale.tools?.[localeKey]?.seo?.faq || [];
  const schemas = renderToolSchemas(toolName, canonUrl, faq);
  result = result.replace(/<\/head>/, `  ${schemas}\n</head>`);

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

  // Pre-render SEO content section
  if (seoHtml) {
    result = result.replace(
      '<div id="seo-content"></div>',
      `<div id="seo-content">${seoHtml}\n        </div>`,
    );
  }

  // Generic data-i18n* resolution — handles H1, description <p>, hero
  // tagline, badges, CTAs, breadcrumbs, etc. in one pass.
  result = applyI18nToHtml(result, locale);

  // Site-wide favicon + theme-color.
  result = injectFavicon(result);

  return result;
}

/**
 * Add hreflang to English homepage and pre-render any data-i18n* text from
 * the English locale.
 */
function processEnglishHomePage(html, enLocale) {
  let result = html;

  result = result.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflangBlock('/')}`,
  );

  result = applyI18nToHtml(result, enLocale);
  result = injectFavicon(result);

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

  // Generic data-i18n* resolution — pre-renders hero text and every other
  // string on the homepage so first-paint is fully localised for SEO.
  result = applyI18nToHtml(result, locale);

  // Site-wide favicon + theme-color.
  result = injectFavicon(result);

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

  // Trust / legal pages
  addUrl(`${BASE_URL}/about/`,   '0.6', 'monthly');
  addUrl(`${BASE_URL}/contact/`, '0.5', 'yearly');
  addUrl(`${BASE_URL}/terms/`,   '0.3', 'yearly');
  addUrl(`${BASE_URL}/privacy/`, '0.3', 'yearly');

  // Language homepages
  for (const lang of EXTRA_LANGS) {
    addUrl(`${BASE_URL}/${lang}/`, '0.9', 'weekly');
  }

  // English tool pages
  for (const id of TOOL_IDS) {
    addUrl(
      `${BASE_URL}/${id}/`,
      POPULAR_TOOL_IDS.has(id) ? '0.9' : '0.8',
      'monthly',
    );
  }

  // Localised tool pages
  for (const lang of EXTRA_LANGS) {
    for (const id of TOOL_IDS) {
      addUrl(
        `${BASE_URL}/${lang}/${id}/`,
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
copyFile(path.join(ROOT, '_redirects'), path.join(OUT, '_redirects'));
copyFile(path.join(ROOT, 'ads.txt'), path.join(OUT, 'ads.txt'));
// Load all locales (must come before page transformations).
const locales = {};
for (const lang of ALL_LANGS) {
  locales[lang] = loadLocale(lang);
}

// ── Trust pages (English + localised variants) ───────────────────────────────
// Content for trust pages (about/contact/privacy/terms) is driven entirely by
// data-i18n* attributes in the source HTML and the corresponding strings in
// each locale. We pre-render every variant so Googlebot, AdSense, and slow
// connections see fully localised pages on first byte.
['terms', 'privacy', 'about', 'contact'].forEach(slug => {
  const srcFile = path.join(ROOT, slug, 'index.html');
  if (!fs.existsSync(srcFile)) return;
  const src = fs.readFileSync(srcFile, 'utf8');

  // English: pre-render data-i18n from en.json + register hreflang block.
  let enHtml = src.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflangBlock(`/${slug}/`)}`,
  );
  enHtml = applyI18nToHtml(enHtml, locales.en);
  enHtml = injectFavicon(enHtml);
  writeFile(path.join(OUT, slug, 'index.html'), enHtml);

  // Localised variants: set lang, swap canonical, hreflang, pre-render i18n.
  for (const lang of EXTRA_LANGS) {
    const canonUrl = `${BASE_URL}/${lang}/${slug}/`;
    let html = src
      .replace(/(<html[^>]*)\blang="en"/, `$1lang="${lang}"`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonUrl}$2`);
    html = html.replace(
      /(<link rel="canonical"[^>]*>)/,
      `$1\n${hreflangBlock(`/${slug}/`)}`,
    );
    html = applyI18nToHtml(html, locales[lang]);
    html = injectFavicon(html);
    writeFile(path.join(OUT, lang, slug, 'index.html'), html);
  }
});

// ── English homepage ──────────────────────────────────────────────────────────
const homeHtmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
writeFile(
  path.join(OUT, 'index.html'),
  processEnglishHomePage(homeHtmlSrc, locales.en),
);

// ── English tool pages ────────────────────────────────────────────────────────
for (const toolId of TOOL_IDS) {
  const srcFile = path.join(ROOT, toolId, 'index.html');
  if (!fs.existsSync(srcFile)) continue;

  const html = fs.readFileSync(srcFile, 'utf8');
  writeFile(
    path.join(OUT, toolId, 'index.html'),
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
    const srcFile = path.join(ROOT, toolId, 'index.html');
    if (!fs.existsSync(srcFile)) continue;

    const html = fs.readFileSync(srcFile, 'utf8');
    writeFile(
      path.join(OUT, lang, toolId, 'index.html'),
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
