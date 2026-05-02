(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const dropZone   = $('vol-drop');
  const controls   = $('vol-controls');
  const fileInfo   = $('vol-file-info');
  const preview    = $('vol-preview');
  const gainEl     = $('vol-gain');
  const gainValEl  = $('vol-gain-value');
  const processBtn = $('vol-process-btn');
  const resetBtn   = $('vol-reset-btn');
  const results    = $('vol-results');
  const resultAudio= $('vol-result-audio');
  const downloadBtn= $('vol-download-btn');

  const state = { file: null, buffer: null, blob: null };

  function err(msg) { Utils.showToast(msg, 'error'); }
  function syncLabel() {
    const v = parseFloat(gainEl.value);
    gainValEl.textContent = (v >= 0 ? '+' : '') + v.toFixed(1) + ' dB';
  }
  gainEl.addEventListener('input', syncLabel);
  syncLabel();

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
    const db = parseFloat(gainEl.value);
    // dB → linear gain: gain = 10^(dB / 20)
    const gain = Math.pow(10, db / 20);
    const out = AudioBase.applyGain(state.buffer, gain);
    state.blob = AudioBase.encodeWav(out);
    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio._url = URL.createObjectURL(state.blob);
    resultAudio.src = resultAudio._url;
    results.classList.remove('hidden');
  }

  function download() {
    if (!state.blob) return;
    const base = (state.file?.name || 'audio').replace(/\.[^.]+$/, '');
    Utils.downloadFile(state.blob, `${base}-volume.wav`, 'audio/wav');
  }

  function reset() {
    state.file = null; state.buffer = null; state.blob = null;
    preview.removeAttribute('src');
    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio.src = '';
    fileInfo.textContent = '';
    gainEl.value = 0; syncLabel();
    results.classList.add('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  processBtn.addEventListener('click', process);
  downloadBtn.addEventListener('click', download);
  resetBtn.addEventListener('click', reset);
})();
