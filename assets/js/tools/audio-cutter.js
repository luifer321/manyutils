(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const dropZone = $('cutter-drop');
  const controls = $('cutter-controls');
  const fileInfo = $('cutter-file-info');
  const preview  = $('cutter-preview');
  const startEl  = $('cutter-start');
  const endEl    = $('cutter-end');
  const rStart   = $('cutter-range-start');
  const rEnd     = $('cutter-range-end');
  const selLabel = $('cutter-selection');
  const processBtn = $('cutter-process-btn');
  const resetBtn   = $('cutter-reset-btn');
  const results  = $('cutter-results');
  const resultAudio = $('cutter-result-audio');
  const downloadBtn = $('cutter-download-btn');

  const state = { file: null, buffer: null, blob: null };

  function err(msg) { Utils.showToast(msg, 'error'); }

  function syncFromInputs() {
    let s = parseFloat(startEl.value) || 0;
    let e = parseFloat(endEl.value)   || 0;
    s = Math.max(0, Math.min(state.buffer ? state.buffer.duration : 0, s));
    e = Math.max(s + 0.01, Math.min(state.buffer ? state.buffer.duration : 0, e));
    startEl.value = s.toFixed(2);
    endEl.value   = e.toFixed(2);
    if (state.buffer) {
      rStart.value = (s / state.buffer.duration) * 100;
      rEnd.value   = (e / state.buffer.duration) * 100;
    }
    selLabel.textContent = `${AudioBase.fmtTime(s)}–${AudioBase.fmtTime(e)}`;
  }

  function syncFromRanges() {
    if (!state.buffer) return;
    const dur = state.buffer.duration;
    let s = (parseFloat(rStart.value) / 100) * dur;
    let e = (parseFloat(rEnd.value)   / 100) * dur;
    if (e < s + 0.05) {
      // Push the other handle to maintain a tiny minimum width.
      if (rStart === document.activeElement) e = Math.min(dur, s + 0.05);
      else s = Math.max(0, e - 0.05);
    }
    startEl.value = s.toFixed(2);
    endEl.value   = e.toFixed(2);
    selLabel.textContent = `${AudioBase.fmtTime(s)}–${AudioBase.fmtTime(e)}`;
  }

  [startEl, endEl].forEach(el => el.addEventListener('input', syncFromInputs));
  [rStart, rEnd].forEach(el => el.addEventListener('input', syncFromRanges));

  async function handleFile(file) {
    try {
      state.file = file;
      state.buffer = await AudioBase.decode(file);
      state.blob = null;

      preview.src = URL.createObjectURL(file);
      const dur = state.buffer.duration;
      startEl.value = '0';
      endEl.value = dur.toFixed(2);
      endEl.max = dur.toFixed(2);
      rStart.value = 0;
      rEnd.value = 100;

      fileInfo.textContent =
        `${file.name} — ${AudioBase.fmtTime(dur)} — ${state.buffer.numberOfChannels}ch @ ${state.buffer.sampleRate}Hz`;
      selLabel.textContent = `0:00–${AudioBase.fmtTime(dur)}`;

      dropZone.classList.add('hidden');
      controls.classList.remove('hidden');
      results.classList.add('hidden');
    } catch (e) {
      err(e.message);
    }
  }

  function process() {
    if (!state.buffer) return;
    const s = parseFloat(startEl.value) || 0;
    const e = parseFloat(endEl.value)   || state.buffer.duration;
    if (e - s < 0.01) return err('Selection is too short.');

    const cut = AudioBase.copyRange(state.buffer, s, e);
    state.blob = AudioBase.encodeWav(cut);

    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio._url = URL.createObjectURL(state.blob);
    resultAudio.src = resultAudio._url;
    results.classList.remove('hidden');
  }

  function download() {
    if (!state.blob) return;
    const base = (state.file?.name || 'audio').replace(/\.[^.]+$/, '');
    Utils.downloadFile(state.blob, `${base}-cut.wav`, 'audio/wav');
  }

  function reset() {
    state.file = null; state.buffer = null; state.blob = null;
    preview.removeAttribute('src');
    if (resultAudio._url) URL.revokeObjectURL(resultAudio._url);
    resultAudio.src = '';
    fileInfo.textContent = '';
    startEl.value = '0'; endEl.value = ''; rStart.value = 0; rEnd.value = 100;
    selLabel.textContent = '0:00–0:00';
    results.classList.add('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  processBtn.addEventListener('click', process);
  downloadBtn.addEventListener('click', download);
  resetBtn.addEventListener('click', reset);
})();
