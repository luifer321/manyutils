const Components = {
  renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    header.innerHTML = `
      <nav class="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <a href="${homeUrl()}" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                </svg>
              </div>
              <span class="text-white font-bold text-lg group-hover:text-primary-400">ManyUtils</span>
            </a>
            <div class="hidden md:flex items-center gap-6">
              <a href="${homeUrl()}" class="text-slate-300 hover:text-white text-sm font-medium" data-i18n="common.home">Home</a>
              <a href="${homeUrl()}#tools" class="text-slate-300 hover:text-white text-sm font-medium" data-i18n="common.tools">Tools</a>
              <a href="${guidesUrl()}" class="text-slate-300 hover:text-white text-sm font-medium" data-i18n="common.guides">Guides</a>
              <div class="relative" id="lang-switcher">
                <button id="lang-toggle" class="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-800">
                  <span id="lang-current">🇺🇸 EN</span>
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </button>
                <div id="lang-dropdown" class="lang-dropdown absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                  ${i18n.supportedLangs.map(l => {
                    const active = l.code === i18n.currentLang;
                    return `
                    <button data-lang="${l.code}" class="lang-option w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${active ? 'text-white bg-slate-700 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-700'}">
                      <span>${l.flag}</span>
                      <span class="flex-1">${l.name}</span>
                      ${active ? '<svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>' : ''}
                    </button>`;
                  }).join('')}
                </div>
              </div>
            </div>
            <button id="mobile-menu-toggle" class="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
            </button>
          </div>
        </div>
        <div id="mobile-menu" class="mobile-menu md:hidden border-t border-slate-800">
          <div class="px-4 py-3 space-y-2">
            <a href="${homeUrl()}" class="block text-slate-300 hover:text-white text-sm font-medium py-2" data-i18n="common.home">Home</a>
            <a href="${homeUrl()}#tools" class="block text-slate-300 hover:text-white text-sm font-medium py-2" data-i18n="common.tools">Tools</a>
            <a href="${guidesUrl()}" class="block text-slate-300 hover:text-white text-sm font-medium py-2" data-i18n="common.guides">Guides</a>
            <div class="border-t border-slate-800 pt-2 mt-2">
              <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Language</p>
              <div class="flex flex-wrap gap-2">
                ${i18n.supportedLangs.map(l => {
                  const active = l.code === i18n.currentLang;
                  return `<button data-lang="${l.code}" class="lang-option text-sm px-3 py-1.5 rounded-lg ${active ? 'bg-primary-500 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-700'}">${l.flag} ${l.code.toUpperCase()}</button>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
    this.initHeaderEvents();
  },

  initHeaderEvents() {
    const toggle = document.getElementById('lang-toggle');
    const dropdown = document.getElementById('lang-dropdown');
    if (toggle && dropdown) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
    }
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    }
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        const supportedCodes = i18n.supportedLangs.map(l => l.code);

        // Strip any existing language prefix from the current path.
        // e.g. "/es/json-formatter/" → "/json-formatter/"
        //      "/json-formatter/"         → "/json-formatter/"
        //      "/fr/"                      → "/"
        let basePath = window.location.pathname;
        const prefixMatch = basePath.match(/^\/([a-z]{2})(\/|$)/);
        if (prefixMatch && supportedCodes.includes(prefixMatch[1]) && prefixMatch[1] !== 'en') {
          basePath = basePath.substring(3) || '/';
        }

        // Build the target URL: English uses the bare path, others get /{lang}/…
        const targetPath = lang === 'en' ? basePath : `/${lang}${basePath}`;

        // Persist the preference so the target page's i18n.init() honours it.
        localStorage.setItem('manyutils-lang', lang);

        window.location.href = targetPath;
      });
    });
  },

  renderFooter() {
    const footer = document.getElementById('footer');
    if (!footer) return;
    footer.innerHTML = `
      <footer class="bg-slate-900 border-t border-slate-800 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                  </svg>
                </div>
                <span class="text-white font-bold text-lg">ManyUtils</span>
              </div>
              <p class="text-slate-400 text-sm leading-relaxed" data-i18n="common.footer_tagline">Free online tools that work right in your browser. No signup required.</p>
            </div>
            <div>
              <h4 class="text-white font-semibold text-sm mb-4" data-i18n="common.popular_tools">Popular Tools</h4>
              <ul class="space-y-2">
                ${getPopularTools().slice(0, 5).map(t => `
                  <li><a href="${toolUrl(t.id)}" class="text-slate-400 hover:text-primary-400 text-sm">${i18n.t('tools.' + t.i18nKey + '.name') || t.id.replace(/-/g, ' ')}</a></li>
                `).join('')}
              </ul>
            </div>
            <div>
              <h4 class="text-white font-semibold text-sm mb-4" data-i18n="common.categories">Categories</h4>
              <ul class="space-y-2">
                ${CATEGORIES.map(c => `
                  <li><a href="${homeUrl()}#${c.id}" class="text-slate-400 hover:text-primary-400 text-sm">${i18n.t('categories.' + c.i18nKey) || c.id.replace(/_/g, ' ')}</a></li>
                `).join('')}
              </ul>
            </div>
            <div>
              <h4 class="text-white font-semibold text-sm mb-4" data-i18n="common.learning_center">Learning Center</h4>
              <ul class="space-y-2">
                <li><a href="${typeof guidesUrl === 'function' ? guidesUrl() : '/guides/'}" class="text-slate-400 hover:text-primary-400 text-sm" data-i18n="common.all_guides">All Guides</a></li>
                ${(typeof getFeaturedGuides === 'function' ? getFeaturedGuides(3) : []).map(g => `
                  <li><a href="${typeof guideUrl === 'function' ? guideUrl(g.id) : '/guides/' + g.id + '/'}" class="text-slate-400 hover:text-primary-400 text-sm">${i18n.t('guides.' + g.id + '.title') || g.id}</a></li>
                `).join('')}
              </ul>
            </div>
            <div>
              <h4 class="text-white font-semibold text-sm mb-4" data-i18n="common.company">Company</h4>
              <ul class="space-y-2">
                <li><a href="/about/" class="text-slate-400 hover:text-primary-400 text-sm" data-i18n="common.about">About</a></li>
                <li><a href="/contact/" class="text-slate-400 hover:text-primary-400 text-sm" data-i18n="common.contact">Contact</a></li>
                <li><a href="/privacy/" class="text-slate-400 hover:text-primary-400 text-sm" data-i18n="common.privacy_policy">Privacy Policy</a></li>
                <li><a href="/terms/" class="text-slate-400 hover:text-primary-400 text-sm" data-i18n="common.terms">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div class="border-t border-slate-800 mt-8 pt-8 text-center">
            <p class="text-slate-500 text-sm">&copy; ${new Date().getFullYear()} ManyUtils. <span data-i18n="common.footer_rights">All rights reserved.</span></p>
          </div>
        </div>
      </footer>
    `;
  },

  /** Single link-row markup for a tool — reused by the sidebar and by guide pages' "Related Tools" section. */
  toolLinkRowHtml(tool) {
    return `
      <li>
        <a href="${toolUrl(tool.id)}" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 group">
          <div class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100">
            ${tool.icon}
          </div>
          <span class="text-sm text-slate-700 group-hover:text-slate-900 font-medium">${i18n.t('tools.' + tool.i18nKey + '.name') || tool.id.replace(/-/g, ' ')}</span>
        </a>
      </li>`;
  },

  /** Renders a list of tools as link rows into any container (sidebar widgets, guide "Related Tools" section). */
  renderToolLinkList(container, tools, opts = {}) {
    if (!container) return;
    if (!tools.length) { container.innerHTML = ''; return; }
    const heading = opts.heading || i18n.t('common.related_tools') || 'Related Tools';
    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 class="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">${heading}</h3>
        <ul class="space-y-2">${tools.map(t => Components.toolLinkRowHtml(t)).join('')}</ul>
      </div>`;
  },

  renderSidebar() {
    const sidebar = document.getElementById('sidebar-content');
    if (!sidebar) return;
    const currentToolId = document.documentElement.dataset.tool || '';
    const current = (typeof TOOLS !== 'undefined') && TOOLS.find(t => t.id === currentToolId);
    const sameCategory = current
      ? TOOLS.filter(t => t.category === current.category && t.id !== currentToolId)
      : [];

    let tools;
    let heading;
    if (sameCategory.length) {
      tools = (typeof getRelatedTools === 'function')
        ? getRelatedTools(currentToolId, 5)
        : sameCategory.slice(0, 5);
      heading = i18n.t('common.related_tools') || 'Related Tools';
    } else {
      // Category singleton (or unknown tool) — fill the column with popular/other tools.
      const popular = (typeof getPopularTools === 'function') ? getPopularTools() : [];
      tools = popular.filter(t => t.id !== currentToolId).slice(0, 5);
      if (!tools.length && typeof TOOLS !== 'undefined') {
        tools = TOOLS.filter(t => t.id !== currentToolId).slice(0, 5);
      }
      heading = i18n.t('common.other_tools') || 'Other Tools';
    }
    Components.renderToolLinkList(sidebar, tools, { heading });
  },

  /** Single card markup for a guide — reused by the guides index, homepage "Featured Guides",
   *  tool pages' "Related Guides" section, and guide pages' own "Related Guides" section.
   *  Title/description/category name are resolved from the current-language locale strings
   *  loaded by i18n (guide content is localised in locales/<lang>.json under `guides.<id>`). */
  guideCardHtml(guide) {
    const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'en';
    const title = i18n.t(`guides.${guide.id}.title`) || guide.id;
    const desc  = i18n.t(`guides.${guide.id}.description`) || '';
    const catName = i18n.t(`guide_categories.${guide.category}`) || guide.category;
    const readingTime = `${guide.readingTimeMinutes} ${i18n.t('common.min_read_suffix') || 'min read'}`;
    return `
      <a href="${guideUrl(guide.id, lang)}" class="guide-card bg-white rounded-2xl border border-slate-200 p-5 hover:border-primary-200 block">
        <span class="inline-block text-xs font-semibold uppercase tracking-wider text-primary-600 bg-primary-50 rounded-full px-2.5 py-1 mb-3">${catName}</span>
        <h3 class="font-semibold text-slate-900 mb-1.5 leading-snug">${title}</h3>
        <p class="text-sm text-slate-500 leading-relaxed mb-3">${desc}</p>
        <span class="text-xs text-slate-400">${readingTime}</span>
      </a>`;
  },

  /** "About the author" card — used in the sidebar of every guide page. */
  authorCardHtml(authorId) {
    const author = (typeof getAuthor === 'function') && getAuthor(authorId);
    if (!author) return '';
    const initial = author.name.charAt(0);
    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 class="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider" data-i18n="common.written_by">Written By</h3>
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold flex-shrink-0">${initial}</div>
          <div>
            <p class="font-semibold text-slate-900 text-sm">${author.name}</p>
            <p class="text-xs text-slate-500 mb-2">${author.title}</p>
            ${author.linkedin ? `<a href="${author.linkedin}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11.001-4.124 2.062 2.062 0 010 4.124zM7.114 20.452H3.558V9h3.556v11.452z"/></svg>
              LinkedIn
            </a>` : ''}
          </div>
        </div>
      </div>`;
  },

  /**
   * Renders a grid of guide cards into any container.
   * - No `opts.heading`: the container is assumed to already carry its own
   *   grid classes (homepage "Featured Guides", guides index) — card markup
   *   is written directly into it, with no extra wrapping grid div.
   * - With `opts.heading`: used for a plain (non-grid) card, such as a tool
   *   or guide page's "Related Guides" section — a heading and a grid
   *   wrapper are both rendered inside the container.
   */
  renderGuideCards(container, guides, opts = {}) {
    if (!container) return;
    if (!guides.length) { container.innerHTML = ''; return; }
    const cardsHtml = guides.map(g => Components.guideCardHtml(g)).join('');
    if (!opts.heading) { container.innerHTML = cardsHtml; return; }
    container.innerHTML = `
      <h2 class="text-xl font-bold text-slate-900 mb-4">${opts.heading}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${cardsHtml}</div>`;
  },

  initFaqAccordion() {
    // Event delegation — survives SEO re-renders and avoids double-binding
    // (two listeners on the same button cancel each other out).
    if (this._faqDelegated) return;
    this._faqDelegated = true;
    document.addEventListener('click', (e) => {
      const question = e.target.closest('.faq-question');
      if (!question) return;
      const item = question.closest('.faq-item');
      if (!item) return;
      const wasActive = item.classList.contains('active');
      const group = item.parentElement || document;
      group.querySelectorAll(':scope > .faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  },
};
