#!/usr/bin/env node
/**
 * Generator for the Learning Center: the guides index page + one outline
 * page per entry in assets/js/guides-registry.js.
 *
 * This file is dual-purpose:
 *   1. Run directly to (re)generate the English-language source pages that
 *      live in the repo under guides/ — the same pages `node server.js`
 *      serves straight from disk during local dev:
 *
 *        node scripts/_gen-guide-pages.js
 *
 *   2. `require()`d by scripts/build-static.js, which calls `renderGuidePage`
 *      / `renderGuidesIndex` again for every other supported language and
 *      writes the result into dist/<lang>/guides/ — exactly how localised
 *      tool pages are produced from a single English source. Guides are
 *      simple enough (no hand-authored HTML) that we render straight from
 *      data for every language rather than post-processing English HTML.
 *
 * Re-run step 1 whenever a guide is added, renamed, or its `status` flips
 * from 'draft' to 'published'. Step 2 always happens automatically as part
 * of `npm run build`.
 *
 * This script only ever writes structure + metadata (title, meta
 * description, headings, suggested FAQs, related tools/guides, schema) —
 * it never writes long-form prose (see the top-of-file comment in
 * guides-registry.js). Long-form content sections are marked with a "Draft
 * outline" badge and an HTML comment describing what should eventually be
 * written there.
 *
 * Draft guides (`status: 'draft'`) are built with
 * <meta name="robots" content="noindex, follow"> so they don't compete for
 * rankings — or read as thin content to an ad-network reviewer — before
 * they have real content. Flip a guide's `status` to 'published' once it's
 * written (in every language it should go live in), re-run this script, and
 * add the URL to sitemap.xml (handled automatically by scripts/build-static.js).
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const {
  GUIDES, GUIDE_CATEGORIES, getAuthor, getRelatedGuides,
  guideUrl, guidesIndexUrl, readingTimeText,
} = require('../assets/js/guides-registry.js');

const ROOT     = path.join(__dirname, '..');
const BASE_URL = 'https://manyutils.com';
const ALL_LANGS   = ['en', 'fr', 'es', 'de', 'pt'];
const EXTRA_LANGS = ALL_LANGS.filter(l => l !== 'en');

function writeFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Same shape as build-static.js's hreflangBlock() — kept local so this file has no cross-dependency on it. */
function hreflangBlock(pathForLang) {
  const lines = ALL_LANGS.map(lang =>
    `  <link rel="alternate" hreflang="${lang}"        href="${BASE_URL}${pathForLang(lang)}">`,
  );
  lines.push(`  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${pathForLang('en')}">`);
  return lines.join('\n');
}

function t(locale, key, fallback) {
  const v = key.split('.').reduce((acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), locale);
  return typeof v === 'string' ? v : fallback;
}

// ─── Single guide page ────────────────────────────────────────────────────────

function renderGuidePage({ guide, lang, locale }) {
  const g = locale.guides && locale.guides[guide.id];
  if (!g) throw new Error(`Missing locales/${lang}.json guides.${guide.id}`);

  const title       = g.title;
  const description = g.description;
  const intro       = (typeof g.intro === 'string' && g.intro.trim()) ? g.intro.trim() : '';
  // Normalise sections/faqs to {heading,body} / {q,a} objects (legacy string
  // forms still work so a half-migrated locale never breaks the build).
  const sections = (g.sections || []).map(s =>
    (typeof s === 'string') ? { heading: s, body: '' } : { heading: s.heading || '', body: s.body || '' },
  );
  const faqs = (g.faqs || []).map(f =>
    (typeof f === 'string') ? { q: f, a: '' } : { q: f.q || '', a: f.a || '' },
  );
  const faqsReady = faqs.length > 0 && faqs.every(f => f.a && f.a.trim());
  const catName     = (locale.guide_categories && locale.guide_categories[guide.category]) || guide.category;
  const author       = getAuthor(guide.authorId);
  const readingTime  = readingTimeText(guide, locale);

  const isDraft    = guide.status !== 'published';
  const robotsMeta = isDraft ? 'noindex, follow' : 'index, follow';
  const langPath   = guideUrl(guide.id, lang);
  const canonical  = `${BASE_URL}${langPath}`;
  const catAnchor  = `${guidesIndexUrl(lang)}#${guide.category}`;

  const homeLabel   = t(locale, 'common.home', 'Home');
  const lcLabel      = t(locale, 'common.learning_center', 'Learning Center');
  const willCover    = t(locale, 'common.guide_will_cover', 'What this guide will cover');
  const faqLabel      = t(locale, 'common.faq', 'Frequently Asked Questions');
  const draftBadge    = t(locale, 'common.draft_outline_badge', 'Draft outline — content in progress');
  const draftContent  = t(locale, 'common.draft_content_soon', 'Draft outline — content coming soon.');
  const draftAnswer   = t(locale, 'common.draft_answer_soon', 'Draft outline — answer coming soon.');
  const lastUpdatedLbl = t(locale, 'common.last_updated', 'Last updated');
  const writtenByLbl   = t(locale, 'common.written_by', 'Written By');
  const aboutGuideLbl  = t(locale, 'common.about_this_guide', 'About this guide');
  const readingTimeLbl = t(locale, 'common.reading_time', 'Reading time');
  const categoryLbl    = t(locale, 'common.category', 'Category');
  const relatedGuidesLbl = t(locale, 'common.related_guides', 'Related Guides');
  const relatedToolsLbl  = t(locale, 'common.related_tools', 'Related Tools');
  const homeUrl = lang === 'en' ? '/' : `/${lang}/`;

  const authorJsonLd = author
    ? { '@type': 'Person', name: author.name, ...(author.linkedin ? { sameAs: [author.linkedin] } : {}) }
    : { '@type': 'Organization', name: 'ManyUtils Team' };

  const faqSchemaBlock = faqsReady ? `
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
    })),
  }, null, 2)}
  </script>` : `  <!--
    FAQPage JSON-LD is emitted automatically once every faqs[].a in
    locales/${lang}.json → guides.${guide.id} has a non-empty answer.
  -->`;

  function sectionBodyHtml(sec) {
    if (sec.body && sec.body.trim()) {
      return `<div class="text-slate-600 leading-relaxed space-y-3">${sec.body}</div>`;
    }
    return `<!-- TODO: Write locales/${lang}.json → guides.${guide.id}.sections[].body for "${esc(sec.heading)}" -->
            <p class="text-sm text-slate-400 italic border border-dashed border-slate-300 rounded-xl p-4">${esc(draftContent)}</p>`;
  }

  function faqAnswerHtml(faq) {
    if (faq.a && faq.a.trim()) {
      return `<div class="faq-answer px-4 text-slate-600"><div class="pb-2 space-y-2">${faq.a}</div></div>`;
    }
    return `<div class="faq-answer px-4 text-slate-600"><p class="pb-2 italic text-slate-400"><!-- TODO: write locales/${lang}.json → guides.${guide.id}.faqs[].a --> ${esc(draftAnswer)}</p></div>`;
  }

  return `<!DOCTYPE html>
<!--
  GENERATED FILE — do not hand-edit.
  Source of truth: assets/js/guides-registry.js (id: "${guide.id}") + locales/${lang}.json (guides.${guide.id})
  Regenerate with: node scripts/_gen-guide-pages.js (English) — other languages are
  regenerated automatically by scripts/build-static.js into dist/<lang>/guides/.

  STATUS: ${isDraft ? 'DRAFT — noindexed until real content is written.' : 'PUBLISHED'}
  TODO: Fill intro / sections[].body / faqs[].a in locales/${lang}.json, then
  set status: 'published' for this guide in guides-registry.js and re-run.
-->
<html lang="${lang}" data-guide="${guide.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="alternate icon" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <link rel="mask-icon" href="/assets/favicon.svg" color="#6366f1">
  <meta name="theme-color" content="#6366f1">
  <title>${esc(title)} | ManyUtils ${esc(lcLabel)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${robotsMeta}">
  <link rel="canonical" href="${canonical}">
${hreflangBlock(l => guideUrl(guide.id, l))}
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)} | ManyUtils ${esc(lcLabel)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="ManyUtils">
  <meta property="og:image" content="https://manyutils.com/assets/images/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)} | ManyUtils ${esc(lcLabel)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="https://manyutils.com/assets/images/og-default.png">
  <!-- Structured Data: Article + Breadcrumb (+ FAQPage once answers are filled) -->
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    inLanguage: lang,
    author: authorJsonLd,
    publisher: { '@type': 'Organization', name: 'ManyUtils', url: 'https://manyutils.com/' },
    datePublished: guide.lastUpdated,
    dateModified: guide.lastUpdated,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  }, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: `${BASE_URL}${homeUrl}` },
      { '@type': 'ListItem', position: 2, name: lcLabel, item: `${BASE_URL}${guidesIndexUrl(lang)}` },
      { '@type': 'ListItem', position: 3, name: catName, item: `${BASE_URL}${catAnchor}` },
      { '@type': 'ListItem', position: 4, name: title, item: canonical },
    ],
  }, null, 2)}
  </script>
${faqSchemaBlock}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/assets/js/tailwind-config.js"></script>
  <link rel="stylesheet" href="/assets/css/styles.css">
  <meta name="google-adsense-account" content="ca-pub-5377170083939417">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5377170083939417"
       crossorigin="anonymous"></script>
</head>
<body class="bg-slate-50 font-sans antialiased text-slate-800">
  <header id="header"></header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav aria-label="Breadcrumb" class="text-xs text-slate-500 mb-4">
      <ol class="flex flex-wrap items-center gap-1.5">
        <li><a href="${homeUrl}" class="hover:text-primary-600">${esc(homeLabel)}</a></li>
        <li class="text-slate-300">/</li>
        <li><a href="${guidesIndexUrl(lang)}" class="hover:text-primary-600">${esc(lcLabel)}</a></li>
        <li class="text-slate-300">/</li>
        <li><a href="${catAnchor}" class="hover:text-primary-600">${esc(catName)}</a></li>
        <li class="text-slate-300">/</li>
        <li class="text-slate-700 font-medium">${esc(title)}</li>
      </ol>
    </nav>

    <section class="mb-8 max-w-3xl">
      <span class="inline-block text-xs font-semibold uppercase tracking-wider text-primary-600 bg-primary-50 rounded-full px-2.5 py-1 mb-3">${esc(catName)}</span>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">${esc(title)}</h1>
      <p class="text-lg text-slate-600 leading-relaxed">${esc(description)}</p>
      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
        <span class="inline-flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          ${esc(readingTime)}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          ${esc(lastUpdatedLbl)} ${esc(guide.lastUpdated)}
        </span>
        ${author ? `<span class="inline-flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
          ${esc(author.name)}
        </span>` : ''}
        ${isDraft ? `<span class="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 font-medium">${esc(draftBadge)}</span>` : ''}
      </div>
    </section>

    <div class="lg:grid lg:grid-cols-12 lg:gap-8">
      <div class="lg:col-span-8">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">

          ${intro ? `<section class="mb-10 prose-like">
            <div class="text-slate-600 leading-relaxed space-y-3">${intro}</div>
          </section>` : ''}

          <section class="mb-10" aria-labelledby="sec-covers">
            <h2 id="sec-covers" class="text-xl font-bold text-slate-900 mb-3">${esc(willCover)}</h2>
            <ul class="list-disc list-inside text-slate-600 space-y-1.5">
              ${sections.map(s => `<li>${esc(s.heading)}</li>`).join('\n              ')}
            </ul>
          </section>

${sections.map((sec, i) => `          <section class="mb-10" aria-labelledby="sec-${i}">
            <h2 id="sec-${i}" class="text-xl font-bold text-slate-900 mb-3">${esc(sec.heading)}</h2>
            ${sectionBodyHtml(sec)}
          </section>
`).join('\n')}
          <section aria-labelledby="sec-faq">
            <h2 id="sec-faq" class="text-xl font-bold text-slate-900 mb-4">${esc(faqLabel)}</h2>
            <div class="space-y-3">
              ${faqs.map((faq, i) => `<div class="faq-item border border-slate-200 rounded-xl overflow-hidden${i === 0 ? ' active' : ''}">
                <button class="faq-question w-full flex items-center justify-between p-4 text-left font-medium text-slate-900 hover:bg-slate-50">
                  <span>${esc(faq.q)}</span>
                  <svg class="faq-chevron w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </button>
                ${faqAnswerHtml(faq)}
              </div>`).join('\n              ')}
            </div>
          </section>
        </div>

        <!-- Related Guides — pre-rendered from guides-registry.js + locale content so this list never needs manual upkeep and is present without JS. -->
        ${(() => {
          const related = getRelatedGuides(guide.id, 3);
          if (!related.length) return '';
          const cards = related.map(rg => {
            const rgc = locale.guides && locale.guides[rg.id];
            const rgCat = (locale.guide_categories && locale.guide_categories[rg.category]) || rg.category;
            return `
              <a href="${guideUrl(rg.id, lang)}" class="guide-card bg-white rounded-2xl border border-slate-200 p-5 hover:border-primary-200 block">
                <span class="inline-block text-xs font-semibold uppercase tracking-wider text-primary-600 bg-primary-50 rounded-full px-2.5 py-1 mb-3">${esc(rgCat)}</span>
                <h3 class="font-semibold text-slate-900 mb-1.5 leading-snug">${esc(rgc ? rgc.title : rg.id)}</h3>
                <p class="text-sm text-slate-500 leading-relaxed mb-3">${esc(rgc ? rgc.description : '')}</p>
                <span class="text-xs text-slate-400">${esc(readingTimeText(rg, locale))}</span>
              </a>`;
          }).join('');
          return `<div class="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-4">${esc(relatedGuidesLbl)}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${cards}</div>
        </div>`;
        })()}
      </div>

      <aside class="mt-8 lg:mt-0 lg:col-span-4">
        <div class="space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 class="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider">${esc(aboutGuideLbl)}</h3>
            <dl class="text-sm text-slate-600 space-y-2">
              <div class="flex justify-between"><dt>${esc(readingTimeLbl)}</dt><dd class="font-medium text-slate-800">${esc(readingTime)}</dd></div>
              <div class="flex justify-between"><dt>${esc(lastUpdatedLbl)}</dt><dd class="font-medium text-slate-800">${esc(guide.lastUpdated)}</dd></div>
              <div class="flex justify-between"><dt>${esc(categoryLbl)}</dt><dd class="font-medium text-slate-800">${esc(catName)}</dd></div>
            </dl>
          </div>

          ${author ? `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 class="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider">${esc(writtenByLbl)}</h3>
            <div class="flex items-start gap-3">
              <div class="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold flex-shrink-0">${esc(author.name.charAt(0))}</div>
              <div>
                <p class="font-semibold text-slate-900 text-sm">${esc(author.name)}</p>
                <p class="text-xs text-slate-500 mb-2">${esc(author.title)}</p>
                ${author.linkedin ? `<a href="${esc(author.linkedin)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11.001-4.124 2.062 2.062 0 010 4.124zM7.114 20.452H3.558V9h3.556v11.452z"/></svg>
                  LinkedIn
                </a>` : ''}
              </div>
            </div>
          </div>` : ''}

          ${(guide.relatedTools && guide.relatedTools.length) ? `<div id="related-tools-content"></div>` : ''}
        </div>
      </aside>
    </div>
  </main>

  <footer id="footer"></footer>

  <script src="/assets/js/tools-registry.js"></script>
  <script src="/assets/js/guides-registry.js"></script>
  <script src="/assets/js/utils.js"></script>
  <script src="/assets/js/i18n.js"></script>
  <script src="/assets/js/components.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      await i18n.init();
      Components.renderHeader();
      Components.renderFooter();
      Components.initFaqAccordion();

      const toolIds = ${JSON.stringify(guide.relatedTools || [])};
      const tools = (typeof TOOLS !== 'undefined') ? TOOLS.filter(t => toolIds.includes(t.id)) : [];
      Components.renderToolLinkList(document.getElementById('related-tools-content'), tools, { heading: '${esc(relatedToolsLbl)}' });
    });
  </script>
</body>
</html>
`;
}

// ─── Guides index (Learning Center hub) ──────────────────────────────────────

function renderGuidesIndex({ lang, locale }) {
  const lcLabel     = t(locale, 'common.learning_center', 'Learning Center');
  const allLabel    = t(locale, 'common.all_guides', 'All Guides');
  const homeLabel   = t(locale, 'common.home', 'Home');
  const heroDesc     = t(
    locale,
    'guides_index.description',
    "Plain-English guides behind every ManyUtils tool — what a QR code actually is, how JSON syntax works, PNG vs JPG, and more. Guides are being written and published gradually; each one links straight to the tool it's about.",
  );
  const canonical = `${BASE_URL}${guidesIndexUrl(lang)}`;
  const homeUrl   = lang === 'en' ? '/' : `/${lang}/`;

  const cardsHtml = GUIDES.map(guide => {
    const g   = locale.guides && locale.guides[guide.id];
    const cat = (locale.guide_categories && locale.guide_categories[guide.category]) || guide.category;
    return `
      <a href="${guideUrl(guide.id, lang)}" data-category="${guide.category}" class="guide-card bg-white rounded-2xl border border-slate-200 p-5 hover:border-primary-200 block">
        <span class="inline-block text-xs font-semibold uppercase tracking-wider text-primary-600 bg-primary-50 rounded-full px-2.5 py-1 mb-3">${esc(cat)}</span>
        <h3 class="font-semibold text-slate-900 mb-1.5 leading-snug">${esc(g ? g.title : guide.id)}</h3>
        <p class="text-sm text-slate-500 leading-relaxed mb-3">${esc(g ? g.description : '')}</p>
        <span class="text-xs text-slate-400">${esc(readingTimeText(guide, locale))}</span>
      </a>`;
  }).join('');

  const categoryButtons = GUIDE_CATEGORIES.map(cat => {
    const name = (locale.guide_categories && locale.guide_categories[cat.id]) || cat.id;
    return `<button data-category="${cat.id}" class="category-btn px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600">${esc(name)}</button>`;
  }).join('');

  return `<!DOCTYPE html>
<!-- GENERATED FILE — do not hand-edit. Regenerate with: node scripts/_gen-guide-pages.js (English) / npm run build (other languages). -->
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="alternate icon" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <link rel="mask-icon" href="/assets/favicon.svg" color="#6366f1">
  <meta name="theme-color" content="#6366f1">
  <title>${esc(lcLabel)} — ManyUtils</title>
  <meta name="description" content="${esc(heroDesc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
${hreflangBlock(l => guidesIndexUrl(l))}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(lcLabel)} — ManyUtils">
  <meta property="og:description" content="${esc(heroDesc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="ManyUtils">
  <meta property="og:image" content="https://manyutils.com/assets/images/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(lcLabel)} — ManyUtils">
  <meta name="twitter:description" content="${esc(heroDesc)}">
  <meta name="twitter:image" content="https://manyutils.com/assets/images/og-default.png">
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `ManyUtils ${lcLabel}`,
    url: canonical,
    isPartOf: { '@type': 'WebSite', name: 'ManyUtils', url: 'https://manyutils.com/' },
  }, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: `${BASE_URL}${homeUrl}` },
      { '@type': 'ListItem', position: 2, name: lcLabel, item: canonical },
    ],
  }, null, 2)}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/assets/js/tailwind-config.js"></script>
  <link rel="stylesheet" href="/assets/css/styles.css">
  <meta name="google-adsense-account" content="ca-pub-5377170083939417">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5377170083939417"
       crossorigin="anonymous"></script>
</head>
<body class="bg-slate-50 font-sans antialiased text-slate-800">
  <header id="header"></header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav aria-label="Breadcrumb" class="text-xs text-slate-500 mb-4">
      <ol class="flex flex-wrap items-center gap-1.5">
        <li><a href="${homeUrl}" class="hover:text-primary-600">${esc(homeLabel)}</a></li>
        <li class="text-slate-300">/</li>
        <li class="text-slate-700 font-medium">${esc(lcLabel)}</li>
      </ol>
    </nav>

    <section class="mb-10 max-w-3xl">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">${esc(lcLabel)}</h1>
      <p class="text-lg text-slate-600 leading-relaxed">${esc(heroDesc)}</p>
    </section>

    <div class="flex flex-wrap gap-2 mb-8" id="guide-category-filters" role="tablist" aria-label="Guide categories">
      <button data-category="all" class="category-btn active px-4 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white">${esc(allLabel)}</button>
      ${categoryButtons}
    </div>

    <div id="guides-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${cardsHtml}
    </div>
  </main>

  <footer id="footer"></footer>

  <script src="/assets/js/tools-registry.js"></script>
  <script src="/assets/js/guides-registry.js"></script>
  <script src="/assets/js/utils.js"></script>
  <script src="/assets/js/i18n.js"></script>
  <script src="/assets/js/components.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      await i18n.init();
      Components.renderHeader();
      Components.renderFooter();
      const container = document.getElementById('guide-category-filters');
      container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = btn.dataset.category;
          container.querySelectorAll('.category-btn').forEach(b => {
            b.className = b === btn
              ? 'category-btn px-4 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white'
              : 'category-btn px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600';
          });
          document.querySelectorAll('#guides-grid > .guide-card').forEach(card => {
            card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
          });
        });
      });
    });
  </script>
</body>
</html>
`;
}

module.exports = { renderGuidePage, renderGuidesIndex, ALL_LANGS, EXTRA_LANGS };

// ─── CLI entry point: (re)generate the English source pages in guides/ ───────

if (require.main === module) {
  const enLocale = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'en.json'), 'utf8'));
  let written = 0;
  for (const guide of GUIDES) {
    writeFile(
      path.join(ROOT, 'guides', guide.id, 'index.html'),
      renderGuidePage({ guide, lang: 'en', locale: enLocale }),
    );
    written++;
  }
  writeFile(path.join(ROOT, 'guides', 'index.html'), renderGuidesIndex({ lang: 'en', locale: enLocale }));
  console.log(`Generated ${written} guide outline page(s) + guides/index.html (English).`);
}
