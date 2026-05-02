(function () {
  'use strict';
  if (typeof ImageTool === 'undefined') return;

  // Mutable across handlers — collectOptions() reads them, onLoaded() seeds them.
  let aspect = 1;
  let lastEdited = 'width'; // tracks which dimension the user last touched, for aspect-ratio sync

  const $ = id => document.getElementById(id);
  const wEl = $('imgresize-width');
  const hEl = $('imgresize-height');
  const pEl = $('imgresize-percent');
  const keepRatio = $('imgresize-keep-ratio');
  const fmtEl = $('imgresize-format');

  // Two-way sync between width/height when the lock is on.
  wEl.addEventListener('input', () => {
    lastEdited = 'width';
    if (keepRatio.checked && wEl.value) {
      hEl.value = Math.max(1, Math.round(parseFloat(wEl.value) / aspect));
    }
    pEl.value = '';
  });
  hEl.addEventListener('input', () => {
    lastEdited = 'height';
    if (keepRatio.checked && hEl.value) {
      wEl.value = Math.max(1, Math.round(parseFloat(hEl.value) * aspect));
    }
    pEl.value = '';
  });
  pEl.addEventListener('input', () => {
    lastEdited = 'percent';
    if (!pEl.value) return;
    const pct = parseFloat(pEl.value) / 100;
    if (img.naturalWidth)  wEl.value = Math.max(1, Math.round(img.naturalWidth  * pct));
    if (img.naturalHeight) hEl.value = Math.max(1, Math.round(img.naturalHeight * pct));
  });

  // We need the img reference for the percent input. Stash it on a shared object.
  const img = {};

  const tool = ImageTool.create({
    prefix: 'imgresize',
    accept: 'image/*',
    outputType: fmtEl.value, // updated dynamically below
    outputExt: 'webp',
    filenameSuffix: '-resized',
    hasQuality: true,
    defaultQuality: 90,
    onLoaded(state) {
      img.naturalWidth  = state.img.naturalWidth;
      img.naturalHeight = state.img.naturalHeight;
      aspect = state.img.naturalWidth / state.img.naturalHeight;
      wEl.value = state.img.naturalWidth;
      hEl.value = state.img.naturalHeight;
      pEl.value = '';
    },
    collectOptions(state) {
      const w = parseInt(wEl.value, 10) || state.img.naturalWidth;
      const h = parseInt(hEl.value, 10) || state.img.naturalHeight;
      return { width: w, height: h };
    },
    processCanvas(srcImg, cfg, opts) {
      // Honour the live format selection — this matters because the underlying
      // ImageTool encodes with cfg.outputType which is captured at create time.
      // We override it on every run so the user can flip formats without reloading.
      cfg.outputType = fmtEl.value;
      cfg.outputExt  = fmtEl.value === 'image/png' ? 'png'
                     : fmtEl.value === 'image/jpeg' ? 'jpg' : 'webp';
      cfg.fillBackground = fmtEl.value === 'image/jpeg' ? '#ffffff' : null;

      const w = opts.width;
      const h = opts.height;
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (cfg.fillBackground) {
        ctx.fillStyle = cfg.fillBackground;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(srcImg, 0, 0, w, h);
      return canvas;
    },
    reactOn: ['width', 'height', 'percent', 'format', 'keep-ratio'],
    onReset() {
      wEl.value = '';
      hEl.value = '';
      pEl.value = '';
      keepRatio.checked = true;
      fmtEl.value = 'image/webp';
    },
  });
})();
