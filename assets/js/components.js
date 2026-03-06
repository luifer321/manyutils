const Components = {
  renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    header.innerHTML = `
      <nav class="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <a href="/" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                </svg>
              </div>
              <span class="text-white font-bold text-lg group-hover:text-primary-400">ManyUtils</span>
            </a>
            <div class="hidden md:flex items-center gap-6">
              <a href="/" class="text-slate-300 hover:text-white text-sm font-medium" data-i18n="common.home">Home</a>
              <a href="/#tools" class="text-slate-300 hover:text-white text-sm font-medium" data-i18n="common.tools">Tools</a>
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
            <a href="/" class="block text-slate-300 hover:text-white text-sm font-medium py-2" data-i18n="common.home">Home</a>
            <a href="/#tools" class="block text-slate-300 hover:text-white text-sm font-medium py-2" data-i18n="common.tools">Tools</a>
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
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <li><a href="${t.path}" class="text-slate-400 hover:text-primary-400 text-sm">${i18n.t('tools.' + t.i18nKey + '.name') || t.id.replace(/-/g, ' ')}</a></li>
                `).join('')}
              </ul>
            </div>
            <div>
              <h4 class="text-white font-semibold text-sm mb-4" data-i18n="common.categories">Categories</h4>
              <ul class="space-y-2">
                ${CATEGORIES.map(c => `
                  <li><a href="/#${c.id}" class="text-slate-400 hover:text-primary-400 text-sm">${i18n.t('categories.' + c.i18nKey) || c.id.replace(/_/g, ' ')}</a></li>
                `).join('')}
              </ul>
            </div>
            <div>
              <h4 class="text-white font-semibold text-sm mb-4" data-i18n="common.legal">Legal</h4>
              <ul class="space-y-2">
                <li><a href="/privacy.html" class="text-slate-400 hover:text-primary-400 text-sm" data-i18n="common.privacy_policy">Privacy Policy</a></li>
                <li><a href="/terms.html" class="text-slate-400 hover:text-primary-400 text-sm" data-i18n="common.terms">Terms of Service</a></li>
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

  renderAdBanner(containerId, size = 'banner') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const sizes = {
      banner: 'h-[90px]',
      leaderboard: 'h-[90px] sm:h-[90px]',
      sidebar: 'h-[250px]',
    };
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="ad-space ${sizes[size] || sizes.banner}">
          <span data-i18n="common.ad_space">Advertisement</span>
        </div>
      </div>
    `;
  },

  renderSidebar() {
    const sidebar = document.getElementById('sidebar-content');
    if (!sidebar) return;
    const currentToolId = document.documentElement.dataset.tool || '';
    const related = getRelatedTools(currentToolId, 5);
    sidebar.innerHTML = `
      <div class="space-y-6">
        <div class="ad-space h-[250px]">
          <span data-i18n="common.ad_space">Advertisement</span>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 class="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider" data-i18n="common.related_tools">Related Tools</h3>
          <ul class="space-y-2">
            ${related.map(t => `
              <li>
                <a href="${t.path}" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 group">
                  <div class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100">
                    ${t.icon}
                  </div>
                  <span class="text-sm text-slate-700 group-hover:text-slate-900 font-medium">${i18n.t('tools.' + t.i18nKey + '.name') || t.id.replace(/-/g, ' ')}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  },

  initFaqAccordion() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question');
      if (question) {
        question.addEventListener('click', () => {
          const wasActive = item.classList.contains('active');
          document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
          if (!wasActive) item.classList.add('active');
        });
      }
    });
  },
};
