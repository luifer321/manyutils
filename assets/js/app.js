// ─── Schema injection helpers ────────────────────────────────────────────────
function _injectJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function _injectFaqSchema(faqItems) {
  if (!faqItems || faqItems.length === 0) return;
  _injectJsonLd('mu-faq-schema', {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  });
}

function _injectBreadcrumbSchema(toolName) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const url = canonical ? canonical.href : window.location.href;
  _injectJsonLd('mu-breadcrumb-schema', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://manyutils.com/' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://manyutils.com/#tools' },
      { '@type': 'ListItem', position: 3, name: toolName, item: url }
    ]
  });
}

// ─── i18n helpers ────────────────────────────────────────────────────────────
function _l(key, fallback) {
  const v = i18n.t(key);
  return (v && v !== key) ? v : fallback;
}

// ─── Section builders ────────────────────────────────────────────────────────
function _sectionWhatIs(toolName, intro) {
  if (!intro) return '';
  const heading = _l('common.what_is', 'What is') + ' ' + toolName + '?';
  return `
    <section class="mb-10" aria-labelledby="sec-what-is">
      <h2 id="sec-what-is" class="text-xl font-bold text-slate-900 mb-3">${heading}</h2>
      <div class="text-slate-600 leading-relaxed space-y-3">${intro}</div>
    </section>`;
}

function _sectionValueProps(items) {
  if (!Array.isArray(items) || !items.length) return '';
  const heading = _l('common.why_useful', 'Why this tool is useful');
  const cards = items.map(it => `
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 class="font-semibold text-slate-900 mb-1.5 text-sm">${it.title}</h3>
          <p class="text-sm text-slate-600 leading-relaxed">${it.body}</p>
        </div>`).join('');
  return `
    <section class="mb-10" aria-labelledby="sec-why">
      <h2 id="sec-why" class="text-xl font-bold text-slate-900 mb-4">${heading}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${cards}
      </div>
    </section>`;
}

function _sectionSteps(toolName, steps) {
  if (!Array.isArray(steps) || !steps.length) return '';
  const heading = _l('common.how_to_use', 'How to use') + ' ' + toolName;
  const items = steps.map(s => `<li class="pl-1 leading-relaxed">${s}</li>`).join('');
  return `
    <section class="mb-10" aria-labelledby="sec-how-to">
      <h2 id="sec-how-to" class="text-xl font-bold text-slate-900 mb-3">${heading}</h2>
      <ol class="list-decimal list-inside text-slate-600 space-y-2">${items}
      </ol>
    </section>`;
}

function _sectionUseCases(items) {
  if (!Array.isArray(items) || !items.length) return '';
  const heading = _l('common.use_cases', 'Common Use Cases');
  const cards = items.map(it => `
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 class="font-semibold text-slate-900 mb-1.5 text-sm">${it.title}</h3>
          <p class="text-sm text-slate-600 leading-relaxed">${it.body}</p>
        </div>`).join('');
  return `
    <section class="mb-10" aria-labelledby="sec-use-cases">
      <h2 id="sec-use-cases" class="text-xl font-bold text-slate-900 mb-4">${heading}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${cards}
      </div>
    </section>`;
}

function _sectionBestPractices(items) {
  if (!Array.isArray(items) || !items.length) return '';
  const heading = _l('common.best_practices', 'Best Practices');
  const listItems = items.map(m => `
        <li class="flex items-start gap-3">
          <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">&#10003;</span>
          <span class="leading-relaxed">${m}</span>
        </li>`).join('');
  return `
    <section class="mb-10" aria-labelledby="sec-best-practices">
      <h2 id="sec-best-practices" class="text-xl font-bold text-slate-900 mb-4">${heading}</h2>
      <ul class="text-slate-600 space-y-2.5">${listItems}
      </ul>
    </section>`;
}

function _sectionRelatedGuides(toolId) {
  if (typeof getGuidesForTool !== 'function') return '';
  const guides = getGuidesForTool(toolId, 3);
  if (!guides.length) return '';
  const heading = _l('common.related_guides', 'Related Guides');
  const cards = guides.map(g => Components.guideCardHtml(g)).join('');
  return `
    <section class="mb-10 mt-10" aria-labelledby="sec-related-guides">
      <h2 id="sec-related-guides" class="text-xl font-bold text-slate-900 mb-4">${heading}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${cards}
      </div>
    </section>`;
}

function _sectionExamples(examples) {
  if (!Array.isArray(examples) || !examples.length) return '';
  const heading = _l('common.examples', 'Example input and output');
  const blocks = examples.map(ex => `
        <div class="rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-800">${ex.title}</div>
          <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div>
              <div class="px-4 pt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</div>
              <pre class="px-4 pb-4 pt-1 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">${Utils.escapeHtml(ex.input || '')}</pre>
            </div>
            <div>
              <div class="px-4 pt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Output</div>
              <pre class="px-4 pb-4 pt-1 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">${Utils.escapeHtml(ex.output || '')}</pre>
            </div>
          </div>
        </div>`).join('');
  return `
    <section class="mb-10" aria-labelledby="sec-examples">
      <h2 id="sec-examples" class="text-xl font-bold text-slate-900 mb-4">${heading}</h2>
      <div class="space-y-4">${blocks}
      </div>
    </section>`;
}

function _sectionMistakes(mistakes) {
  if (!Array.isArray(mistakes) || !mistakes.length) return '';
  const heading = _l('common.common_mistakes', 'Common mistakes to avoid');
  const items = mistakes.map(m => `
        <li class="flex items-start gap-3">
          <span class="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5">!</span>
          <span class="leading-relaxed">${m}</span>
        </li>`).join('');
  return `
    <section class="mb-10" aria-labelledby="sec-mistakes">
      <h2 id="sec-mistakes" class="text-xl font-bold text-slate-900 mb-4">${heading}</h2>
      <ul class="text-slate-600 space-y-2.5">${items}
      </ul>
    </section>`;
}

function _sectionFaq(faqItems) {
  if (!Array.isArray(faqItems) || !faqItems.length) return '';
  const heading = _l('common.faq', 'Frequently Asked Questions');
  const chevron = `<svg class="faq-chevron w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>`;
  const items = faqItems.map((item, i) => `
        <div class="faq-item border border-slate-200 rounded-xl overflow-hidden${i === 0 ? ' active' : ''}">
          <button class="faq-question w-full flex items-center justify-between p-4 text-left font-medium text-slate-900 hover:bg-slate-50">
            <span>${item.q}</span>${chevron}
          </button>
          <div class="faq-answer px-4 text-slate-600"><p class="pb-2">${item.a}</p></div>
        </div>`).join('');
  return `
    <section aria-labelledby="sec-faq">
      <h2 id="sec-faq" class="text-xl font-bold text-slate-900 mb-4">${heading}</h2>
      <div class="space-y-3">${items}
      </div>
    </section>`;
}

function _sectionCta() {
  const heading = _l('common.cta_more_title', 'Looking for more free tools?');
  const body    = _l('common.cta_more_body',  'ManyUtils has dozens of fast, privacy-friendly utilities for developers, designers, writers and everyday users. All free, all in your browser.');
  const link    = _l('common.cta_more_link',  'Browse all tools →');
  return `
    <section class="mt-10 rounded-2xl bg-gradient-to-br from-primary-50 to-violet-50 border border-primary-100 p-6">
      <h2 class="text-lg font-bold text-slate-900 mb-1.5">${heading}</h2>
      <p class="text-slate-600 text-sm leading-relaxed mb-4">${body}</p>
      <a href="${homeUrl()}#tools" class="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-semibold text-sm">${link}</a>
    </section>`;
}

// ─── Main renderer ───────────────────────────────────────────────────────────
function renderSeoSection() {
  const container = document.getElementById('seo-content');
  if (!container) return;

  const toolId = document.documentElement.dataset.tool;
  if (!toolId) return;

  const tool = (typeof TOOLS !== 'undefined') && TOOLS.find(t => t.id === toolId);
  if (!tool) return;

  const toolName = i18n.t(`tools.${tool.i18nKey}.name`) || toolId.replace(/-/g, ' ');
  const seo      = i18n.translations?.tools?.[tool.i18nKey]?.seo || {};

  const html = [
    _sectionWhatIs(toolName, seo.intro),
    _sectionSteps(toolName, seo.steps),
    _sectionUseCases(seo.useCases),
    _sectionValueProps(seo.valueProps),
    _sectionBestPractices(seo.bestPractices),
    _sectionExamples(seo.examples),
    _sectionMistakes(seo.mistakes),
    _sectionFaq(seo.faq),
    _sectionRelatedGuides(toolId),
    _sectionCta(),
  ].filter(Boolean).join('');

  container.innerHTML = html;
  Components.initFaqAccordion();
  _injectFaqSchema(seo.faq);
  _injectBreadcrumbSchema(toolName);
}

// Called by components.js after a language switch
function updateSeoHeadings() {
  renderSeoSection();
}

document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init();
  Components.renderHeader();
  Components.renderFooter();
  Components.renderSidebar();
  Components.initFaqAccordion();
  renderSeoSection();
  i18n.applyTranslations();
});
