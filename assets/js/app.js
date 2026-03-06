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
      { '@type': 'ListItem', position: 2, name: toolName, item: url }
    ]
  });
}

function renderSeoSection() {
  const container = document.getElementById('seo-content');
  if (!container) return;

  const toolId = document.documentElement.dataset.tool;
  if (!toolId) return;

  const tool = (typeof TOOLS !== 'undefined') && TOOLS.find(t => t.id === toolId);
  if (!tool) return;

  const toolName = i18n.t(`tools.${tool.i18nKey}.name`) || toolId.replace(/-/g, ' ');
  const whatIs = i18n.t('common.what_is') || 'What is';
  const howTo = i18n.t('common.how_to_use') || 'How to Use';
  const faqLabel = i18n.t('common.faq') || 'Frequently Asked Questions';

  const seo = i18n.translations?.tools?.[tool.i18nKey]?.seo;
  const intro = seo?.intro || '';
  const steps = Array.isArray(seo?.steps) ? seo.steps : [];
  const faqItems = Array.isArray(seo?.faq) ? seo.faq : [];

  let html = '';

  if (intro) {
    html += `
      <div class="mb-8">
        <h2 class="text-xl font-bold text-slate-900 mb-3">${whatIs} ${toolName}?</h2>
        <p class="text-slate-600 leading-relaxed">${intro}</p>
      </div>`;
  }

  if (steps.length > 0) {
    html += `
      <div class="mb-8">
        <h2 class="text-xl font-bold text-slate-900 mb-3">${howTo} ${toolName}</h2>
        <ol class="list-decimal list-inside text-slate-600 space-y-2 leading-relaxed">
          ${steps.map(step => `<li class="pl-1">${step}</li>`).join('')}
        </ol>
      </div>`;
  }

  if (faqItems.length > 0) {
    html += `
      <div>
        <h2 class="text-xl font-bold text-slate-900 mb-4">${faqLabel}</h2>
        <div class="space-y-3">
          ${faqItems.map((item, index) => `
            <div class="faq-item border border-slate-200 rounded-xl overflow-hidden${index === 0 ? ' active' : ''}">
              <button class="faq-question w-full flex items-center justify-between p-4 text-left font-medium text-slate-900 hover:bg-slate-50">
                <span>${item.q}</span>
                <svg class="faq-chevron w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
              </button>
              <div class="faq-answer px-4 text-slate-600"><p class="pb-2">${item.a}</p></div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  container.innerHTML = html;
  Components.initFaqAccordion();
  _injectFaqSchema(faqItems);
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
  Components.renderAdBanner('top-ad-banner', 'leaderboard');
  Components.renderAdBanner('bottom-ad-banner', 'leaderboard');
  Components.renderSidebar();
  renderSeoSection();
  i18n.applyTranslations();
});
