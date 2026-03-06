(function () {
  'use strict';

  const input = document.getElementById('json-input');
  const indentSelect = document.getElementById('json-indent');
  const formatBtn = document.getElementById('json-format-btn');
  const minifyBtn = document.getElementById('json-minify-btn');
  const validateBtn = document.getElementById('json-validate-btn');
  const clearBtn = document.getElementById('json-clear-btn');
  const copyBtn = document.getElementById('json-copy-btn');
  const statusEl = document.getElementById('json-status');
  const statusContent = document.getElementById('json-status-content');
  const outputWrapper = document.getElementById('json-output-wrapper');
  const outputEl = document.getElementById('json-output');

  function getIndent() {
    const val = indentSelect.value;
    if (val === 'tab') return '\t';
    return parseInt(val, 10);
  }

  function showStatus(message, type) {
    statusEl.classList.remove('hidden');

    const colors = {
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      error: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200'
    };

    const icons = {
      success: '<svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      error: '<svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>',
      info: '<svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>'
    };

    statusContent.className = 'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ' + (colors[type] || colors.info);
    statusContent.innerHTML = (icons[type] || '') + '<span>' + escapeHtml(message) + '</span>';
  }

  function hideStatus() {
    statusEl.classList.add('hidden');
  }

  function showOutput(text) {
    outputWrapper.classList.remove('hidden');
    outputEl.textContent = text;
  }

  function hideOutput() {
    outputWrapper.classList.add('hidden');
    outputEl.textContent = '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function parseErrorLocation(errorMessage) {
    const posMatch = errorMessage.match(/position\s+(\d+)/i);
    if (!posMatch) return null;

    const position = parseInt(posMatch[1], 10);
    const textBefore = input.value.substring(0, position);
    const line = (textBefore.match(/\n/g) || []).length + 1;
    const lastNewline = textBefore.lastIndexOf('\n');
    const column = position - lastNewline;

    return { line, column, position };
  }

  function formatJSON() {
    const raw = input.value.trim();
    if (!raw) {
      showStatus('Please enter some JSON to format.', 'error');
      hideOutput();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const formatted = JSON.stringify(parsed, null, getIndent());
      showOutput(formatted);
      showStatus('JSON formatted successfully.', 'success');
    } catch (e) {
      hideOutput();
      const loc = parseErrorLocation(e.message);
      let msg = 'Invalid JSON: ' + e.message;
      if (loc) {
        msg += ' (line ' + loc.line + ', column ' + loc.column + ')';
      }
      showStatus(msg, 'error');
    }
  }

  function minifyJSON() {
    const raw = input.value.trim();
    if (!raw) {
      showStatus('Please enter some JSON to minify.', 'error');
      hideOutput();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const minified = JSON.stringify(parsed);
      showOutput(minified);
      showStatus('JSON minified successfully (' + minified.length + ' characters).', 'success');
    } catch (e) {
      hideOutput();
      const loc = parseErrorLocation(e.message);
      let msg = 'Invalid JSON: ' + e.message;
      if (loc) {
        msg += ' (line ' + loc.line + ', column ' + loc.column + ')';
      }
      showStatus(msg, 'error');
    }
  }

  function validateJSON() {
    const raw = input.value.trim();
    if (!raw) {
      showStatus('Please enter some JSON to validate.', 'error');
      hideOutput();
      return;
    }

    try {
      JSON.parse(raw);
      showStatus('Valid JSON!', 'success');
    } catch (e) {
      const loc = parseErrorLocation(e.message);
      let msg = 'Invalid JSON: ' + e.message;
      if (loc) {
        msg += ' (line ' + loc.line + ', column ' + loc.column + ')';
      }
      showStatus(msg, 'error');
    }
  }

  function clearAll() {
    input.value = '';
    hideStatus();
    hideOutput();
  }

  function copyOutput() {
    const text = outputEl.textContent;
    if (!text) return;

    if (typeof Utils !== 'undefined') {
      Utils.copyToClipboard(text);
      Utils.showToast('Copied to clipboard!', 'success');
    } else {
      navigator.clipboard.writeText(text).then(() => {
        showStatus('Copied to clipboard!', 'info');
      });
    }
  }

  formatBtn.addEventListener('click', formatJSON);
  minifyBtn.addEventListener('click', minifyJSON);
  validateBtn.addEventListener('click', validateJSON);
  clearBtn.addEventListener('click', clearAll);
  copyBtn.addEventListener('click', copyOutput);
})();
