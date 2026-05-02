(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const dropZone   = $('a2w-drop');
  const controls   = $('a2w-controls');
  const fileInfo   = $('a2w-file-info');
  const preview    = $('a2w-preview');
  const processBtn = $('a2w-process-btn');
  const resetBtn   = $('a2w-reset-btn');
  const results    = $('a2w-results');
  const resultAudio= $('a2w-result-audio');
  const outputInfo = $('a2w-output-info');
  const downloadBtn= $('a2w-download-btn');

  const state = { file: null, buffer: null, blob: null };

  function err(msg) { Utils.showToast(msg, 'error'); }
  function fmtBytes(b) {
    if (!b) return '0 B';
    const k = 1024, u = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + u[i];
  }

  async function handleFile(file) {
    try {
      state.file = file;
      state.buffer = await AudioBase.decode(file);
      state.blob = null;
      preview.src = URL.createObjectURL(file);
      fileInfo.textContent =
        `${file.name} — ${AudioBase.fmtTime(state.buffer.duration)} — ${state.buffer.numberOfChannels}ch @ ${state.buffer.sampleRate}Hz — ${fmtBytes(file.size)}`;
      dropZone.classList.add('hidden');
      controls.classList.remove('hidden');
      results.classList.add('hidden');
    } catch (e) { err(e.message); }
  }

  function process() {
    if (!state.buffer) return;
    state.blob = AudioBase.encodeWav(state.buffer);
    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio._url = URL.createObjectURL(state.blob);
    resultAudio.src = resultAudio._url;
    outputInfo.textContent =
      `WAV (16-bit PCM) — ${state.buffer.numberOfChannels}ch @ ${state.buffer.sampleRate}Hz — ${fmtBytes(state.blob.size)}`;
    results.classList.remove('hidden');
  }

  function download() {
    if (!state.blob) return;
    const base = (state.file?.name || 'audio').replace(/\.[^.]+$/, '');
    Utils.downloadFile(state.blob, `${base}.wav`, 'audio/wav');
  }

  function reset() {
    state.file = null; state.buffer = null; state.blob = null;
    preview.removeAttribute('src');
    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio.src = '';
    fileInfo.textContent = '';
    outputInfo.textContent = '';
    results.classList.add('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  processBtn.addEventListener('click', process);
  downloadBtn.addEventListener('click', download);
  resetBtn.addEventListener('click', reset);
})();
