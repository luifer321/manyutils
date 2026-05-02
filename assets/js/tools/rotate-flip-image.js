(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const dropZone   = $('rotflip-drop');
  const controls   = $('rotflip-controls');
  const fileInfo   = $('rotflip-file-info');
  const canvas     = $('rotflip-canvas');
  const angleEl    = $('rotflip-angle');
  const fmtEl      = $('rotflip-format');
  const downloadBtn= $('rotflip-download-btn');
  const resetBtn   = $('rotflip-reset-btn');

  const state = {
    file: null,
    img: null,
    angle: 0,    // degrees
    flipH: false,
    flipV: false,
    blob: null,
  };

  function showError(msg) {
    if (typeof Utils !== 'undefined') Utils.showToast(msg, 'error'); else alert(msg);
  }

  // Render the source image to the canvas with the current rotation/flip applied.
  // For 90/270° rotations we swap canvas dimensions so nothing is clipped.
  function render() {
    if (!state.img) return;
    const a = ((state.angle % 360) + 360) % 360;
    const rad = a * Math.PI / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const w = state.img.naturalWidth;
    const h = state.img.naturalHeight;

    const outW = Math.round(w * cos + h * sin);
    const outH = Math.round(w * sin + h * cos);
    canvas.width  = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d');
    if (fmtEl.value === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);
    }

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate(rad);
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
    ctx.drawImage(state.img, -w / 2, -h / 2, w, h);
    ctx.restore();

    canvas.toBlob(blob => { state.blob = blob; }, fmtEl.value, 0.92);
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showError('Please select a valid image file.');
      return;
    }
    state.file = file;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.img = img;
        state.angle = 0;
        state.flipH = false;
        state.flipV = false;
        angleEl.value = 0;
        fileInfo.textContent = `${file.name} — ${img.naturalWidth} × ${img.naturalHeight}px`;
        dropZone.classList.add('hidden');
        controls.classList.remove('hidden');
        render();
      };
      img.onerror = () => showError('Could not decode this image.');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // Action buttons
  document.querySelectorAll('.rotflip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      if (act === 'rotate') {
        state.angle = (state.angle + parseInt(btn.dataset.deg, 10)) % 360;
        angleEl.value = state.angle;
      } else if (act === 'flip-h') {
        state.flipH = !state.flipH;
      } else if (act === 'flip-v') {
        state.flipV = !state.flipV;
      } else if (act === 'reset-trans') {
        state.angle = 0;
        state.flipH = false;
        state.flipV = false;
        angleEl.value = 0;
      }
      render();
    });
  });

  angleEl.addEventListener('input', () => {
    state.angle = parseFloat(angleEl.value) || 0;
    render();
  });
  fmtEl.addEventListener('change', render);

  function download() {
    if (!state.blob) return;
    const ext = fmtEl.value === 'image/png' ? 'png'
              : fmtEl.value === 'image/jpeg' ? 'jpg' : 'webp';
    const base = (state.file?.name || 'image').replace(/\.[^.]+$/, '');
    Utils.downloadFile(state.blob, `${base}-edited.${ext}`, state.blob.type);
  }

  function reset() {
    state.file = null;
    state.img = null;
    state.blob = null;
    state.angle = 0;
    state.flipH = false;
    state.flipV = false;
    canvas.width = 0;
    canvas.height = 0;
    fileInfo.textContent = '';
    angleEl.value = 0;
    fmtEl.value = 'image/png';
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  downloadBtn.addEventListener('click', download);
  resetBtn.addEventListener('click', reset);
})();
