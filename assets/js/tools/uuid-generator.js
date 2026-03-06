(function () {
  'use strict';

  const output = document.getElementById('uuid-output');
  const copyBtn = document.getElementById('uuid-copy-btn');
  const generateBtn = document.getElementById('uuid-generate-btn');
  const uppercaseCb = document.getElementById('uuid-uppercase');
  const hyphensCb = document.getElementById('uuid-hyphens');
  const countInput = document.getElementById('uuid-count');
  const bulkBtn = document.getElementById('uuid-bulk-btn');
  const multiOutput = document.getElementById('uuid-multi-output');
  const multiList = document.getElementById('uuid-multi-list');
  const copyAllBtn = document.getElementById('uuid-copy-all-btn');

  function generateUUIDv4() {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  function formatUUID(uuid) {
    let result = uuid;
    if (!hyphensCb.checked) {
      result = result.replace(/-/g, '');
    }
    if (uppercaseCb.checked) {
      result = result.toUpperCase();
    }
    return result;
  }

  function generateSingle() {
    const uuid = formatUUID(generateUUIDv4());
    output.textContent = uuid;
    return uuid;
  }

  function generateBulk() {
    const count = Math.max(1, Math.min(100, parseInt(countInput.value, 10) || 5));
    countInput.value = count;

    const uuids = [];
    for (let i = 0; i < count; i++) {
      uuids.push(formatUUID(generateUUIDv4()));
    }

    output.textContent = uuids[0];
    multiOutput.classList.remove('hidden');
    multiList.innerHTML = '';

    uuids.forEach(uuid => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-3 py-1.5';

      const text = document.createElement('span');
      text.className = 'break-all select-all';
      text.textContent = uuid;

      const copyRowBtn = document.createElement('button');
      copyRowBtn.className = 'flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors';
      copyRowBtn.title = 'Copy';
      copyRowBtn.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>';
      copyRowBtn.addEventListener('click', () => copyText(uuid));

      row.appendChild(text);
      row.appendChild(copyRowBtn);
      multiList.appendChild(row);
    });
  }

  function copyText(text) {
    if (typeof Utils !== 'undefined') {
      Utils.copyToClipboard(text);
      Utils.showToast('Copied to clipboard!', 'success');
    } else {
      navigator.clipboard.writeText(text);
    }
  }

  function copyAll() {
    const items = multiList.querySelectorAll('span');
    const all = Array.from(items).map(s => s.textContent).join('\n');
    copyText(all);
  }

  generateBtn.addEventListener('click', () => {
    generateSingle();
    multiOutput.classList.add('hidden');
  });

  copyBtn.addEventListener('click', () => copyText(output.textContent));
  bulkBtn.addEventListener('click', generateBulk);
  copyAllBtn.addEventListener('click', copyAll);

  uppercaseCb.addEventListener('change', () => {
    if (multiOutput.classList.contains('hidden')) {
      generateSingle();
    } else {
      generateBulk();
    }
  });

  hyphensCb.addEventListener('change', () => {
    if (multiOutput.classList.contains('hidden')) {
      generateSingle();
    } else {
      generateBulk();
    }
  });

  generateSingle();
})();
