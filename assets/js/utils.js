const Utils = {
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      Utils.showToast(i18n.t('common.copied') || 'Copied!', 'success');
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      Utils.showToast(i18n.t('common.copied') || 'Copied!', 'success');
      return true;
    }
  },

  showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  },

  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  downloadCanvas(canvas, filename = 'image.png') {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  },

  setupDropZone(element, onFile) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = element.dataset.accept || '*';
    input.style.display = 'none';
    document.body.appendChild(input);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
      element.addEventListener(event, e => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    ['dragenter', 'dragover'].forEach(event => {
      element.addEventListener(event, () => element.classList.add('drag-over'));
    });
    ['dragleave', 'drop'].forEach(event => {
      element.addEventListener(event, () => element.classList.remove('drag-over'));
    });
    element.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files.length > 0) onFile(files[0]);
    });

    input.addEventListener('change', () => {
      if (input.files.length > 0) onFile(input.files[0]);
    });

    element.addEventListener('click', () => {
      // Ensure selecting the same file again still triggers change.
      input.value = '';
      input.click();
    });

    element.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.value = '';
        input.click();
      }
    });
  },

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  generateId() {
    return Math.random().toString(36).substring(2, 10);
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  showLoading(container) {
    const loader = document.createElement('div');
    loader.className = 'flex items-center justify-center py-8';
    loader.id = 'loading-indicator';
    loader.innerHTML = '<div class="spinner"></div><span class="ml-3 text-slate-500 text-sm">Loading...</span>';
    container.appendChild(loader);
  },

  hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.remove();
  },

  createCopyButton(targetSelector) {
    const btn = document.createElement('button');
    btn.className = 'absolute top-2 right-2 p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white';
    btn.title = 'Copy';
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`;
    btn.addEventListener('click', () => {
      const target = document.querySelector(targetSelector);
      if (target) Utils.copyToClipboard(target.textContent);
    });
    return btn;
  },
};
