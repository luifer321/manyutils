(function () {
  const modeEncode = document.getElementById('mode-encode');
  const modeDecode = document.getElementById('mode-decode');
  const inputEl = document.getElementById('b64-input');
  const outputEl = document.getElementById('b64-output');
  const inputCount = document.getElementById('input-count');
  const outputCount = document.getElementById('output-count');
  const actionBtn = document.getElementById('action-btn');
  const copyOutputBtn = document.getElementById('copy-output-btn');
  const clearBtn = document.getElementById('clear-btn');
  const swapBtn = document.getElementById('swap-btn');
  const errorMsg = document.getElementById('error-msg');

  let mode = 'encode';

  function setMode(newMode) {
    mode = newMode;
    if (mode === 'encode') {
      modeEncode.className = 'flex-1 px-5 py-2.5 font-medium text-sm transition-colors bg-primary-500 text-white';
      modeDecode.className = 'flex-1 px-5 py-2.5 font-medium text-sm transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200';
      inputEl.placeholder = 'Enter text to encode…';
      actionBtn.textContent = 'Encode';
    } else {
      modeDecode.className = 'flex-1 px-5 py-2.5 font-medium text-sm transition-colors bg-primary-500 text-white';
      modeEncode.className = 'flex-1 px-5 py-2.5 font-medium text-sm transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200';
      inputEl.placeholder = 'Enter Base64 string to decode…';
      actionBtn.textContent = 'Decode';
    }
    hideError();
    process();
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';
  }

  function updateCounts() {
    const ic = inputEl.value.length;
    const oc = outputEl.value.length;
    inputCount.textContent = `${ic} character${ic !== 1 ? 's' : ''}`;
    outputCount.textContent = `${oc} character${oc !== 1 ? 's' : ''}`;
  }

  function process() {
    hideError();
    const input = inputEl.value;
    if (!input) {
      outputEl.value = '';
      updateCounts();
      return;
    }

    try {
      if (mode === 'encode') {
        outputEl.value = utf8ToBase64(input);
      } else {
        const cleaned = input.replace(/\s/g, '');
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
          throw new Error('Input contains invalid Base64 characters.');
        }
        if (cleaned.length % 4 !== 0) {
          throw new Error('Invalid Base64 string length. Base64 strings must have a length that is a multiple of 4.');
        }
        outputEl.value = base64ToUtf8(cleaned);
      }
    } catch (e) {
      outputEl.value = '';
      showError(mode === 'decode'
        ? `Decoding error: ${e.message || 'Invalid Base64 input.'}`
        : `Encoding error: ${e.message || 'Could not encode the input.'}`
      );
    }

    updateCounts();
  }

  modeEncode.addEventListener('click', () => setMode('encode'));
  modeDecode.addEventListener('click', () => setMode('decode'));

  inputEl.addEventListener('input', process);

  actionBtn.addEventListener('click', process);

  copyOutputBtn.addEventListener('click', () => {
    const text = outputEl.value;
    if (!text) return;
    if (typeof Utils !== 'undefined' && Utils.copyToClipboard) {
      Utils.copyToClipboard(text);
      Utils.showToast('Output copied to clipboard!', 'success');
    } else {
      navigator.clipboard.writeText(text);
    }
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    hideError();
    updateCounts();
  });

  swapBtn.addEventListener('click', () => {
    const currentOutput = outputEl.value;
    if (!currentOutput) return;
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    inputEl.value = currentOutput;
    setMode(newMode);
  });

  updateCounts();
})();
