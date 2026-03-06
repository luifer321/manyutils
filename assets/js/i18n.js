const i18n = {
  currentLang: 'en',
  translations: {},
  supportedLangs: [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
  ],

  async init() {
    const saved      = localStorage.getItem('manyutils-lang');
    // The build script sets <html lang="xx"> statically for localised pages.
    // When there is no explicit user preference we honour that declaration so
    // Googlebot (and first-time visitors) always see content in the page's
    // own language rather than falling back to the browser locale.
    const htmlLang   = document.documentElement.lang;
    const browserLang = navigator.language.split('-')[0];

    let lang;
    if (saved && this.supportedLangs.find(l => l.code === saved)) {
      // Explicit user preference always wins.
      lang = saved;
    } else if (htmlLang && htmlLang !== 'en' && this.supportedLangs.find(l => l.code === htmlLang)) {
      // Non-English page declared a supported language — use it.
      lang = htmlLang;
    } else if (this.supportedLangs.find(l => l.code === browserLang)) {
      lang = browserLang;
    } else {
      lang = 'en';
    }

    await this.setLanguage(lang);
  },

  async setLanguage(lang) {
    try {
      const basePath = window.location.hostname === '' || window.location.protocol === 'file:'
        ? '.' : '';
      let localePath = `${basePath}/locales/${lang}.json`;
      const depth = (window.location.pathname.match(/\//g) || []).length;
      if (depth > 1) {
        localePath = '../'.repeat(depth - 1) + `locales/${lang}.json`;
      }
      const res = await fetch(localePath);
      if (!res.ok) throw new Error(`Failed to load ${lang}`);
      this.translations = await res.json();
      this.currentLang = lang;
      localStorage.setItem('manyutils-lang', lang);
      document.documentElement.lang = lang;
      this.applyTranslations();
      document.dispatchEvent(new CustomEvent('manyutils:language-changed', {
        detail: { lang: this.currentLang }
      }));
    } catch (e) {
      console.warn(`Failed to load language "${lang}":`, e);
      if (lang !== 'en') {
        await this.setLanguage('en');
      }
    }
  },

  t(key) {
    const keys = key.split('.');
    let value = this.translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return '';
      }
    }
    return typeof value === 'string' ? value : '';
  },

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) el.textContent = translation;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) el.placeholder = translation;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation) el.title = translation;
    });
    const activeLang = this.supportedLangs.find(l => l.code === this.currentLang);
    const langBtn = document.getElementById('lang-current');
    if (langBtn && activeLang) {
      langBtn.textContent = `${activeLang.flag} ${activeLang.code.toUpperCase()}`;
    }
  },
};
