(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const dropZone   = $('spd-drop');
  const controls   = $('spd-controls');
  const fileInfo   = $('spd-file-info');
  const preview    = $('spd-preview');
  const speedEl    = $('spd-speed');
  const speedValEl = $('spd-speed-value');
  const processBtn = $('spd-process-btn');
  const resetBtn   = $('spd-reset-btn');
  const results    = $('spd-results');
  const resultAudio= $('spd-result-audio');
  const downloadBtn= $('spd-download-btn');

  const state = { file: null, buffer: null, blob: null };

  function err(msg) { Utils.showToast(msg, 'error'); }
  function syncLabel() { speedValEl.textContent = parseFloat(speedEl.value).toFixed(2) + '×'; }
  speedEl.addEventListener('input', syncLabel);
  syncLabel();

  document.querySelectorAll('.spd-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      speedEl.value = btn.dataset.speed;
      syncLabel();
    });
  });

  async function handleFile(file) {
    try {
      state.file = file;
      state.buffer = await AudioBase.decode(file);
      state.blob = null;
      preview.src = URL.createObjectURL(file);
      fileInfo.textContent =
        `${file.name} — ${AudioBase.fmtTime(state.buffer.duration)} — ${state.buffer.numberOfChannels}ch @ ${state.buffer.sampleRate}Hz`;
      dropZone.classList.add('hidden');
      controls.classList.remove('hidden');
      results.classList.add('hidden');
    } catch (e) { err(e.message); }
  }

  function process() {
    if (!state.buffer) return;
    const speed = parseFloat(speedEl.value) || 1;
    const out = AudioBase.changeSpeed(state.buffer, speed);
    state.blob = AudioBase.encodeWav(out);
    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio._url = URL.createObjectURL(state.blob);
    resultAudio.src = resultAudio._url;
    results.classList.remove('hidden');
  }

  function download() {
    if (!state.blob) return;
    const base = (state.file?.name || 'audio').replace(/\.[^.]+$/, '');
    const tag = parseFloat(speedEl.value).toFixed(2).replace('.', '_');
    Utils.downloadFile(state.blob, `${base}-${tag}x.wav`, 'audio/wav');
  }

  function reset() {
    state.file = null; state.buffer = null; state.blob = null;
    preview.removeAttribute('src');
    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio.src = '';
    fileInfo.textContent = '';
    speedEl.value = 1; syncLabel();
    results.classList.add('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  processBtn.addEventListener('click', process);
  downloadBtn.addEventListener('click', download);
  resetBtn.addEventListener('click', reset);
})();
