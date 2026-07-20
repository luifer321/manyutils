// ─── Learning Center data ────────────────────────────────────────────────────
// Single source of truth for every guide and its relationships to tools,
// other guides, and its author. Both the browser (guide pages, homepage,
// tool pages) and the Node build/generator scripts
// (scripts/build-static.js, scripts/_gen-guide-pages.js) read from this file,
// so a relationship only ever needs to be edited here — never inside
// individual HTML pages.
//
// Guides are localized the same way tools are: this file holds only the
// language-agnostic structure (id, category, relationships, dates, author).
// All translatable text — title, description, intro, section headings + body
// copy, FAQ questions + answers, category display names — lives in
// locales/<lang>.json under `guides.<id>` and `guide_categories.<category>`.
// See scripts/_gen-guide-pages.js for how the two are combined at build time.
//
// Locale shape for each guide (locales/<lang>.json → guides.<id>):
//   {
//     "title": "...",
//     "description": "...",           // meta description + hero subtitle
//     "intro": "",                    // optional HTML opening paragraph
//     "sections": [ { "heading": "...", "body": "" } ],  // body = HTML; empty = draft placeholder
//     "faqs":     [ { "q": "...", "a": "" } ]            // a = HTML; empty = draft placeholder
//   }
// Fill `intro` / `sections[].body` / `faqs[].a` with real HTML content as you
// write each guide. Empty strings render a "Draft outline" placeholder; once
// every FAQ has a non-empty answer the generator also emits FAQPage JSON-LD.
//
// Every guide ships as an outline until those fields are filled. Guides with
// `status: 'draft'` are rendered with <meta name="robots" content="noindex, follow">
// and are excluded from sitemap.xml. Flip a guide's status to 'published' once
// its content is written (in every language it should go live in), then re-run
// `node scripts/_gen-guide-pages.js`.

const GUIDE_CATEGORIES = [
  { id: 'qr-codes' },
  { id: 'data-formats' },
  { id: 'identifiers' },
  { id: 'images' },
  { id: 'design' },
  { id: 'media' },
  { id: 'calculators' },
];

// Guide authors. Referenced by `authorId` on each guide below. `linkedin` is
// optional; when present it's rendered as a link and added to the Article
// JSON-LD as `author.sameAs`.
const AUTHORS = {
  'luis-avila': {
    name: 'Luis Avila',
    title: 'Full-Stack Developer',
    bio: 'Full-Stack Developer specializing in scalable web and mobile applications with React.js, Next.js, Ruby on Rails, PostgreSQL, and React Native. Works across frontend and backend to deliver high-performance, user-focused solutions. Holds a Bachelor\u2019s degree in Electrical and Electronics Engineering from Universidad del Norte.',
    linkedin: 'https://www.linkedin.com/in/luifer321/',
  },
};

const GUIDES = [
  // ── QR Codes ────────────────────────────────────────────────────────────
  {
    id: 'what-is-a-qr-code',
    category: 'qr-codes',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: true,
    relatedTools: ['qr-code-generator'],
    relatedGuides: ['static-vs-dynamic-qr-codes', 'qr-code-best-practices'],
  },
  {
    id: 'static-vs-dynamic-qr-codes',
    category: 'qr-codes',
    readingTimeMinutes: 5,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['qr-code-generator'],
    relatedGuides: ['what-is-a-qr-code', 'qr-code-best-practices'],
  },
  {
    id: 'qr-code-best-practices',
    category: 'qr-codes',
    readingTimeMinutes: 7,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['qr-code-generator'],
    relatedGuides: ['what-is-a-qr-code', 'static-vs-dynamic-qr-codes'],
  },
  // ── Data & File Formats ──────────────────────────────────────────────────
  {
    id: 'what-is-json',
    category: 'data-formats',
    readingTimeMinutes: 8,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: true,
    relatedTools: ['json-formatter', 'base64-encoder-decoder'],
    relatedGuides: ['json-validation-guide'],
  },
  {
    id: 'json-validation-guide',
    category: 'data-formats',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['json-formatter'],
    relatedGuides: ['what-is-json'],
  },
  {
    id: 'what-is-base64-encoding',
    category: 'data-formats',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['base64-encoder-decoder'],
    relatedGuides: ['what-is-json'],
  },
  // ── Identifiers & Security ───────────────────────────────────────────────
  {
    id: 'uuid-explained',
    category: 'identifiers',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: true,
    relatedTools: ['uuid-generator'],
    relatedGuides: ['sha256-explained'],
  },
  {
    id: 'sha256-explained',
    category: 'identifiers',
    readingTimeMinutes: 7,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['password-generator', 'base64-encoder-decoder'],
    relatedGuides: ['uuid-explained', 'how-to-create-a-strong-password'],
  },
  {
    id: 'how-to-create-a-strong-password',
    category: 'identifiers',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['password-generator'],
    relatedGuides: ['sha256-explained'],
  },
  // ── Images ───────────────────────────────────────────────────────────────
  {
    id: 'png-vs-jpg',
    category: 'images',
    readingTimeMinutes: 7,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: true,
    relatedTools: ['png-to-jpg', 'jpg-to-png', 'image-compressor'],
    relatedGuides: ['svg-vs-png', 'what-is-webp'],
  },
  {
    id: 'svg-vs-png',
    category: 'images',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['svg-to-png', 'svg-to-jpg', 'svg-to-webp'],
    relatedGuides: ['png-vs-jpg'],
  },
  {
    id: 'what-is-webp',
    category: 'images',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['png-to-webp', 'webp-to-png', 'jpg-to-webp'],
    relatedGuides: ['png-vs-jpg'],
  },
  {
    id: 'image-compression-explained',
    category: 'images',
    readingTimeMinutes: 7,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['image-compressor', 'png-to-jpg'],
    relatedGuides: ['png-vs-jpg', 'how-to-resize-images-without-losing-quality'],
  },
  {
    id: 'how-to-resize-images-without-losing-quality',
    category: 'images',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['image-resizer', 'crop-image'],
    relatedGuides: ['image-compression-explained'],
  },
  // ── Design & Color ───────────────────────────────────────────────────────
  {
    id: 'css-gradients-explained',
    category: 'design',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['css-gradient-generator'],
    relatedGuides: ['color-theory-basics'],
  },
  {
    id: 'color-theory-basics',
    category: 'design',
    readingTimeMinutes: 7,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: true,
    relatedTools: ['color-palette-generator'],
    relatedGuides: ['css-gradients-explained'],
  },
  // ── Media & Audio ────────────────────────────────────────────────────────
  {
    id: 'video-to-gif-guide',
    category: 'media',
    readingTimeMinutes: 5,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['video-to-gif'],
    relatedGuides: ['audio-file-formats-explained'],
  },
  {
    id: 'audio-file-formats-explained',
    category: 'media',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['audio-to-wav', 'mp3-metadata-viewer'],
    relatedGuides: ['video-to-gif-guide'],
  },
  // ── Calculators & Conversions ────────────────────────────────────────────
  {
    id: 'understanding-exchange-rates',
    category: 'calculators',
    readingTimeMinutes: 6,
    lastUpdated: '2026-07-19',
    authorId: 'luis-avila',
    status: 'published',
    featured: false,
    relatedTools: ['currency-converter', 'days-between-dates'],
    relatedGuides: [],
  },
];

/** "6 min read" / "6 min de lectura" / etc. — locale supplies only the unit suffix. */
function readingTimeText(guide, locale) {
  const suffix = locale?.common?.min_read_suffix || 'min read';
  return `${guide.readingTimeMinutes} ${suffix}`;
}

function guideUrl(id, lang) {
  return (!lang || lang === 'en') ? `/guides/${id}/` : `/${lang}/guides/${id}/`;
}

function guidesIndexUrl(lang) {
  return (!lang || lang === 'en') ? '/guides/' : `/${lang}/guides/`;
}

function getGuideById(id) {
  return GUIDES.find(g => g.id === id) || null;
}

function getAuthor(authorId) {
  return AUTHORS[authorId] || null;
}

function getGuidesByCategory(categoryId) {
  return GUIDES.filter(g => g.category === categoryId);
}

function getFeaturedGuides(limit = 4) {
  return GUIDES.filter(g => g.featured).slice(0, limit);
}

/** Guides that list `toolId` in their relatedTools — powers the "Related Guides" section on tool pages. */
function getGuidesForTool(toolId, limit = 3) {
  return GUIDES.filter(g => Array.isArray(g.relatedTools) && g.relatedTools.includes(toolId)).slice(0, limit);
}

/** Guides related to another guide, explicit list first, same-category fallback after. */
function getRelatedGuides(guideId, limit = 3) {
  const current = getGuideById(guideId);
  if (!current) return GUIDES.slice(0, limit);
  const explicit = (current.relatedGuides || [])
    .map(id => getGuideById(id))
    .filter(Boolean);
  if (explicit.length >= limit) return explicit.slice(0, limit);
  const sameCategory = GUIDES.filter(g => g.category === current.category && g.id !== guideId && !explicit.includes(g));
  return [...explicit, ...sameCategory].slice(0, limit);
}

// Node build scripts (scripts/build-static.js, scripts/_gen-guide-pages.js) can
// `require()` this file directly; browsers load it as a plain <script> and use
// the globals above, so this block is a no-op client-side.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GUIDE_CATEGORIES,
    AUTHORS,
    GUIDES,
    guideUrl,
    guidesIndexUrl,
    readingTimeText,
    getGuideById,
    getAuthor,
    getGuidesByCategory,
    getFeaturedGuides,
    getGuidesForTool,
    getRelatedGuides,
  };
}
