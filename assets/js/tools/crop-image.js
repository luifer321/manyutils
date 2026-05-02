(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const dropZone   = $('crop-drop');
  const controls   = $('crop-controls');
  const fileInfo   = $('crop-file-info');
  const stage      = $('crop-stage');
  const xEl = $('crop-x'), yEl = $('crop-y'), wEl = $('crop-w'), hEl = $('crop-h');
  const fmtEl = $('crop-format');
  const qualityEl = $('crop-quality');
  const qualityValEl = $('crop-quality-value');
  const processBtn = $('crop-process-btn');
  const resetBtn   = $('crop-reset-btn');
  const downloadBtn = $('crop-download-btn');
  const results = $('crop-results');
  const previewImg = $('crop-preview-result');

  // Geometry: stage shows the source image scaled to fit. Selection coords are
  // expressed in *image-pixel* space, so scaling/rendering operates on the original.
  const state = {
    file: null,
    img: null,
    natW: 0, natH: 0,
    dispW: 0, dispH: 0, // displayed canvas size
    scale: 1,           // dispW / natW
    sel: { x: 0, y: 0, w: 0, h: 0 }, // image-pixel space
    ratio: 'free',      // 'free' | width/height
    blob: null,
  };

  function showError(msg) {
    if (typeof Utils !== 'undefined') Utils.showToast(msg, 'error'); else alert(msg);
  }

  function setQualityLabel() { qualityValEl.textContent = qualityEl.value + '%'; }
  qualityEl.addEventListener('input', setQualityLabel);

  // Cap how big the preview can get on screen so big photos don't push the layout.
  const MAX_DISP_W = 720;
  const MAX_DISP_H = 520;

  function rebuildStage() {
    stage.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'crop-canvas';
    canvas.width = state.dispW;
    canvas.height = state.dispH;
    canvas.className = 'block';
    stage.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(state.img, 0, 0, state.dispW, state.dispH);

    const overlay = document.createElement('div');
    overlay.className = 'crop-overlay';
    overlay.id = 'crop-overlay';
    overlay.innerHTML = `
      <div class="crop-handle tl" data-handle="tl"></div>
      <div class="crop-handle tr" data-handle="tr"></div>
      <div class="crop-handle bl" data-handle="bl"></div>
      <div class="crop-handle br" data-handle="br"></div>
    `;
    stage.appendChild(overlay);
    syncOverlayFromState();
    wireOverlayDrag(overlay);
  }

  function syncInputs() {
    xEl.value = Math.round(state.sel.x);
    yEl.value = Math.round(state.sel.y);
    wEl.value = Math.round(state.sel.w);
    hEl.value = Math.round(state.sel.h);
  }

  function syncOverlayFromState() {
    const overlay = $('crop-overlay');
    if (!overlay) return;
    overlay.style.left   = (state.sel.x * state.scale) + 'px';
    overlay.style.top    = (state.sel.y * state.scale) + 'px';
    overlay.style.width  = (state.sel.w * state.scale) + 'px';
    overlay.style.height = (state.sel.h * state.scale) + 'px';
    syncInputs();
  }

  function clampSel() {
    const s = state.sel;
    s.x = Math.max(0, Math.min(state.natW - 1, s.x));
    s.y = Math.max(0, Math.min(state.natH - 1, s.y));
    s.w = Math.max(1, Math.min(state.natW - s.x, s.w));
    s.h = Math.max(1, Math.min(state.natH - s.y, s.h));
  }

  function applyRatio() {
    if (state.ratio === 'free') return;
    const [rw, rh] = state.ratio.split(':').map(Number);
    const r = rw / rh;
    // Recalculate height from width (preserves the user's last drag direction reasonably).
    state.sel.h = state.sel.w / r;
    clampSel();
  }

  function wireOverlayDrag(overlay) {
    let startX = 0, startY = 0, startSel = null, mode = null;

    function onPointerDown(e, m) {
      e.preventDefault();
      mode = m;
      startX = e.clientX; startY = e.clientY;
      startSel = { ...state.sel };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup',   onPointerUp);
    }
    function onPointerMove(e) {
      const dx = (e.clientX - startX) / state.scale;
      const dy = (e.clientY - startY) / state.scale;
      const s = state.sel;
      if (mode === 'move') {
        s.x = startSel.x + dx;
        s.y = startSel.y + dy;
      } else {
        // resize from the appropriate corner
        if (mode.includes('l')) { s.x = startSel.x + dx; s.w = startSel.w - dx; }
        if (mode.includes('r')) { s.w = startSel.w + dx; }
        if (mode.includes('t')) { s.y = startSel.y + dy; s.h = startSel.h - dy; }
        if (mode.includes('b')) { s.h = startSel.h + dy; }
        if (state.ratio !== 'free') applyRatio();
      }
      clampSel();
      syncOverlayFromState();
    }
    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
    }

    overlay.addEventListener('pointerdown', e => {
      const handle = e.target.closest('.crop-handle');
      onPointerDown(e, handle ? handle.dataset.handle : 'move');
    });
  }

  // Allow drawing a fresh selection by dragging on the canvas itself.
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.crop-overlay')) return;
    const rect = stage.getBoundingClientRect();
    const startX = (e.clientX - rect.left) / state.scale;
    const startY = (e.clientY - rect.top)  / state.scale;
    state.sel = { x: startX, y: startY, w: 1, h: 1 };
    function move(ev) {
      const cx = (ev.clientX - rect.left) / state.scale;
      const cy = (ev.clientY - rect.top)  / state.scale;
      state.sel.w = cx - startX;
      state.sel.h = cy - startY;
      // Allow drawing in any direction.
      if (state.sel.w < 0) { state.sel.x = cx; state.sel.w = startX - cx; }
      if (state.sel.h < 0) { state.sel.y = cy; state.sel.h = startY - cy; }
      if (state.ratio !== 'free') applyRatio();
      clampSel();
      syncOverlayFromState();
    }
    function up() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });

  [xEl, yEl, wEl, hEl].forEach(el => el.addEventListener('input', () => {
    state.sel.x = parseInt(xEl.value, 10) || 0;
    state.sel.y = parseInt(yEl.value, 10) || 0;
    state.sel.w = parseInt(wEl.value, 10) || 1;
    state.sel.h = parseInt(hEl.value, 10) || 1;
    if (state.ratio !== 'free') applyRatio();
    clampSel();
    syncOverlayFromState();
  }));

  document.querySelectorAll('.crop-ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.crop-ratio-btn').forEach(b => {
        b.className = (b === btn)
          ? 'crop-ratio-btn px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-500 text-white'
          : 'crop-ratio-btn px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:border-primary-300';
      });
      state.ratio = btn.dataset.ratio;
      if (state.sel.w && state.ratio !== 'free') applyRatio();
      clampSel();
      syncOverlayFromState();
    });
  });

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showError('Please select a valid image file.');
      return;
    }
    state.file = file;
    state.blob = null;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.img = img;
        state.natW = img.naturalWidth;
        state.natH = img.naturalHeight;

        const sx = MAX_DISP_W / state.natW;
        const sy = MAX_DISP_H / state.natH;
        state.scale = Math.min(1, sx, sy);
        state.dispW = Math.round(state.natW * state.scale);
        state.dispH = Math.round(state.natH * state.scale);

        // Default selection: centered 60% box.
        const w = Math.round(state.natW * 0.6);
        const h = Math.round(state.natH * 0.6);
        state.sel = { x: (state.natW - w) / 2, y: (state.natH - h) / 2, w, h };

        fileInfo.textContent = `${file.name} — ${state.natW} × ${state.natH}px`;
        dropZone.classList.add('hidden');
        controls.classList.remove('hidden');
        results.classList.add('hidden');
        rebuildStage();
      };
      img.onerror = () => showError('Could not decode this image.');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function performCrop() {
    if (!state.img) return;
    const { x, y, w, h } = state.sel;
    const fmt = fmtEl.value;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
    const ctx = canvas.getContext('2d');
    if (fmt === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(state.img, x, y, w, h, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return showError('Crop failed. Please try another format.');
      state.blob = blob;
      if (previewImg._url) URL.revokeObjectURL(previewImg._url);
      previewImg._url = URL.createObjectURL(blob);
      previewImg.src = previewImg._url;
      results.classList.remove('hidden');
    }, fmt, parseInt(qualityEl.value, 10) / 100);
  }

  function download() {
    if (!state.blob) return;
    const ext = fmtEl.value === 'image/png' ? 'png'
              : fmtEl.value === 'image/jpeg' ? 'jpg' : 'webp';
    const base = (state.file?.name || 'image').replace(/\.[^.]+$/, '');
    Utils.downloadFile(state.blob, `${base}-cropped.${ext}`, state.blob.type);
  }

  function reset() {
    state.file = null;
    state.img = null;
    state.blob = null;
    state.sel = { x: 0, y: 0, w: 0, h: 0 };
    stage.innerHTML = '';
    if (previewImg._url) URL.revokeObjectURL(previewImg._url);
    previewImg.src = '';
    fileInfo.textContent = '';
    [xEl, yEl, wEl, hEl].forEach(el => el.value = '');
    qualityEl.value = 90;
    setQualityLabel();
    fmtEl.value = 'image/png';
    results.classList.add('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  processBtn.addEventListener('click', performCrop);
  downloadBtn.addEventListener('click', download);
  resetBtn.addEventListener('click', reset);
})();
