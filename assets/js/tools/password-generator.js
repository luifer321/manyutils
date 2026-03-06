(function () {
  'use strict';

  const CHARSETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  const lengthSlider = document.getElementById('pw-length');
  const lengthValue = document.getElementById('pw-length-value');
  const uppercaseCb = document.getElementById('pw-uppercase');
  const lowercaseCb = document.getElementById('pw-lowercase');
  const numbersCb = document.getElementById('pw-numbers');
  const symbolsCb = document.getElementById('pw-symbols');
  const countSelect = document.getElementById('pw-count');
  const generateBtn = document.getElementById('pw-generate-btn');
  const copyBtn = document.getElementById('pw-copy-btn');
  const copyAllBtn = document.getElementById('pw-copy-all-btn');
  const output = document.getElementById('pw-output');
  const strengthFill = document.getElementById('pw-strength-fill');
  const strengthLabel = document.getElementById('pw-strength-label');
  const multiOutput = document.getElementById('pw-multi-output');
  const multiList = document.getElementById('pw-multi-list');

  function secureRandom(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  function buildCharset() {
    let chars = '';
    if (uppercaseCb.checked) chars += CHARSETS.uppercase;
    if (lowercaseCb.checked) chars += CHARSETS.lowercase;
    if (numbersCb.checked) chars += CHARSETS.numbers;
    if (symbolsCb.checked) chars += CHARSETS.symbols;
    return chars;
  }

  function generatePassword(length, charset) {
    if (!charset) return '';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[secureRandom(charset.length)];
    }
    return password;
  }

  function calculateStrength(password, charsetSize) {
    const length = password.length;
    const entropy = length * Math.log2(charsetSize || 1);

    if (entropy < 28) return { level: 'Very Weak', percent: 15, color: 'bg-red-500', textColor: 'text-red-600' };
    if (entropy < 36) return { level: 'Weak', percent: 30, color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (entropy < 60) return { level: 'Fair', percent: 50, color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (entropy < 80) return { level: 'Strong', percent: 75, color: 'bg-emerald-500', textColor: 'text-emerald-600' };
    return { level: 'Very Strong', percent: 100, color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  }

  function updateStrength(password, charsetSize) {
    const strength = calculateStrength(password, charsetSize);
    strengthFill.style.width = strength.percent + '%';
    strengthFill.className = 'h-full rounded-full transition-all duration-300 ' + strength.color;
    strengthLabel.textContent = strength.level;
    strengthLabel.className = 'text-sm font-medium mt-1.5 ' + strength.textColor;
  }

  function ensureAtLeastOneChecked() {
    const checkboxes = [uppercaseCb, lowercaseCb, numbersCb, symbolsCb];
    const anyChecked = checkboxes.some(cb => cb.checked);
    if (!anyChecked) {
      lowercaseCb.checked = true;
    }
  }

  function generate() {
    ensureAtLeastOneChecked();

    const charset = buildCharset();
    const length = parseInt(lengthSlider.value, 10);
    const count = parseInt(countSelect.value, 10);

    if (!charset) return;

    const primary = generatePassword(length, charset);
    output.textContent = primary;
    updateStrength(primary, charset.length);

    if (count > 1) {
      multiOutput.classList.remove('hidden');
      multiList.innerHTML = '';

      const passwords = [primary];
      for (let i = 1; i < count; i++) {
        passwords.push(generatePassword(length, charset));
      }

      passwords.forEach((pw, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between gap-3 py-1.5';

        const text = document.createElement('span');
        text.className = 'break-all select-all';
        text.textContent = pw;

        const copyRowBtn = document.createElement('button');
        copyRowBtn.className = 'flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors';
        copyRowBtn.title = 'Copy';
        copyRowBtn.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>';
        copyRowBtn.addEventListener('click', () => copyText(pw));

        row.appendChild(text);
        row.appendChild(copyRowBtn);
        multiList.appendChild(row);
      });
    } else {
      multiOutput.classList.add('hidden');
    }
  }

  function copyText(text) {
    if (typeof Utils !== 'undefined') {
      Utils.copyToClipboard(text);
      Utils.showToast('Copied to clipboard!', 'success');
    } else {
      navigator.clipboard.writeText(text).then(() => {});
    }
  }

  function copyAll() {
    const items = multiList.querySelectorAll('span');
    const all = Array.from(items).map(s => s.textContent).join('\n');
    copyText(all);
  }

  lengthSlider.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;
    generate();
  });

  [uppercaseCb, lowercaseCb, numbersCb, symbolsCb].forEach(cb => {
    cb.addEventListener('change', generate);
  });

  countSelect.addEventListener('change', generate);
  generateBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', () => copyText(output.textContent));
  copyAllBtn.addEventListener('click', copyAll);

  generate();
})();
