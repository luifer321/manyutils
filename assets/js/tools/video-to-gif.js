/**
 * Video → GIF (browser-only).
 *
 * Strategy:
 *   1. Decode the user's video into a hidden <video> element.
 *   2. Sample N frames between [start, end] at the requested FPS by setting
 *      currentTime and waiting for `seeked` events. Draw each into a canvas.
 *   3. Encode the frames into an animated GIF with `gif.js` (small wasm-free
 *      encoder, ~30KB), lazy-loaded from a CDN only when the user clicks
 *      "Convert". This keeps the global bundle untouched.
 *
 * We deliberately avoid ffmpeg.wasm here. ffmpeg.wasm is ~25MB to download,
 * needs SharedArrayBuffer (cross-origin isolation), and crashes on memory
 * pressure for ≥720p clips. The canvas+gif.js path covers the 30s/100MB
 * envelope reliably across browsers and platforms.
 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const dropZone   = $('v2g-drop');
  const controls   = $('v2g-controls');
  const fileInfo   = $('v2g-file-info');
  const videoEl    = $('v2g-preview');
  const startEl    = $('v2g-start');
  const endEl      = $('v2g-end');
  const fpsEl      = $('v2g-fps');
  const widthEl    = $('v2g-width');
  const warning    = $('v2g-warning');
  const convertBtn = $('v2g-convert-btn');
  const resetBtn   = $('v2g-reset-btn');
  const progressWrap = $('v2g-progress-wrap');
  const progressBar  = $('v2g-progress-bar');
  const progressPct  = $('v2g-progress-pct');
  const progressLbl  = $('v2g-progress-label');
  const resultImg  = $('v2g-result');
  const resultsBox = $('v2g-results');
  const outputInfo = $('v2g-output-info');
  const downloadBtn= $('v2g-download-btn');

  const MAX_BYTES    = 100 * 1024 * 1024; // 100MB hard cap
  const MAX_DURATION = 30;                // 30s hard cap

  const state = {
    file: null,
    duration: 0,
    blob: null,
  };

  function showError(msg) {
    if (typeof Utils !== 'undefined') Utils.showToast(msg, 'error'); else alert(msg);
  }

  function setProgress(pct, label) {
    progressWrap.classList.remove('hidden');
    progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    progressPct.textContent = Math.round(pct) + '%';
    if (label) progressLbl.textContent = label;
  }

  function fmtBytes(b) {
    if (!b) return '0 B';
    const k = 1024, units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + units[i];
  }

  // Lazy-load gif.js + its worker only when the user clicks "Convert".
  // Cached per page life so re-runs are instant.
  let _gifJsPromise = null;
  function loadGifJs() {
    if (_gifJsPromise) return _gifJsPromise;
    _gifJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
      s.async = true;
      s.onload  = () => resolve();
      s.onerror = () => reject(new Error('Could not load GIF encoder. Check your network.'));
      document.head.appendChild(s);
    });
    return _gifJsPromise;
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('video/')) {
      showError('Please select a valid video file (MP4, MOV, WebM…).');
      return;
    }
    if (file.size > MAX_BYTES) {
      showError(`File is too large (${fmtBytes(file.size)}). Max is 100 MB.`);
      return;
    }

    state.file = file;
    state.blob = null;
    if (videoEl.src) URL.revokeObjectURL(videoEl.src);
    videoEl.src = URL.createObjectURL(file);
    videoEl.onloadedmetadata = () => {
      state.duration = videoEl.duration;
      const end = Math.min(state.duration, MAX_DURATION);
      startEl.value = 0;
      endEl.value = end.toFixed(2);
      endEl.max = state.duration.toFixed(2);

      fileInfo.textContent =
        `${file.name} — ${videoEl.videoWidth} × ${videoEl.videoHeight}, ${state.duration.toFixed(2)}s, ${fmtBytes(file.size)}`;

      // Soft warning for inputs that may strain low-end devices.
      const big = videoEl.videoWidth >= 1280 || file.size > 25 * 1024 * 1024 || state.duration > 15;
      warning.classList.toggle('hidden', !big);
      if (big) {
        warning.textContent = 'Heads-up: large videos can take 30s+ on lower-end phones. Trim aggressively, drop FPS to 12, and shrink width to ~360 for faster results.';
      }

      dropZone.classList.add('hidden');
      controls.classList.remove('hidden');
      resultsBox.classList.add('hidden');
      progressWrap.classList.add('hidden');
    };
  }

  // Sample a single frame at `time` and return the rendered canvas.
  function captureFrame(time, w, h) {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        videoEl.removeEventListener('seeked', onSeeked);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, w, h);
        resolve(canvas);
      };
      videoEl.addEventListener('seeked', onSeeked, { once: true });
      // Some browsers reject setting currentTime above duration.
      videoEl.currentTime = Math.min(time, Math.max(0, videoEl.duration - 0.001));
      // Failsafe: if no `seeked` fires within 4s, abort that frame to avoid stalling.
      setTimeout(() => {
        videoEl.removeEventListener('seeked', onSeeked);
        reject(new Error('frame-timeout'));
      }, 4000);
    });
  }

  async function convert() {
    if (!state.file) return;

    const start = Math.max(0, parseFloat(startEl.value) || 0);
    let   end   = Math.min(state.duration, parseFloat(endEl.value) || state.duration);
    if (end - start > MAX_DURATION) {
      end = start + MAX_DURATION;
      endEl.value = end.toFixed(2);
      Utils.showToast('Clip trimmed to 30s — that\'s our max.', 'info');
    }
    if (end <= start) {
      showError('End time must be greater than start time.');
      return;
    }
    const fps = parseInt(fpsEl.value, 10);
    let width = parseInt(widthEl.value, 10) || 480;
    width = Math.max(80, Math.min(1920, width));
    const aspect = videoEl.videoHeight / videoEl.videoWidth;
    let height = Math.round(width * aspect);
    if (height % 2) height += 1; // even dimensions are friendlier to encoders

    convertBtn.disabled = true;
    resultsBox.classList.add('hidden');
    setProgress(2, 'Loading encoder…');

    try {
      await loadGifJs();
    } catch (err) {
      convertBtn.disabled = false;
      progressWrap.classList.add('hidden');
      return showError(err.message);
    }

    setProgress(5, 'Capturing frames…');

    // Pause the user-visible playback and reuse the same <video> for seeking.
    videoEl.pause();

    const totalFrames = Math.max(2, Math.round((end - start) * fps));
    const step = (end - start) / totalFrames;

    // eslint-disable-next-line no-undef
    const gif = new GIF({
      workers: 2,
      workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
      quality: 10,
      width, height,
      // Keep the worker memory low on mobile.
      dither: false,
    });

    try {
      for (let i = 0; i < totalFrames; i++) {
        const t = start + i * step;
        const canvas = await captureFrame(t, width, height);
        gif.addFrame(canvas, { delay: Math.round(1000 / fps), copy: true });
        setProgress(5 + (i / totalFrames) * 65, `Capturing frame ${i + 1}/${totalFrames}…`);
      }
    } catch (err) {
      convertBtn.disabled = false;
      progressWrap.classList.add('hidden');
      return showError('Frame capture failed. Try a shorter clip or different file.');
    }

    gif.on('progress', p => setProgress(70 + p * 30, 'Encoding GIF…'));
    gif.on('finished', blob => {
      state.blob = blob;
      if (resultImg._url) URL.revokeObjectURL(resultImg._url);
      resultImg._url = URL.createObjectURL(blob);
      resultImg.src = resultImg._url;
      outputInfo.textContent = `${width} × ${height}px — ${totalFrames} frames @ ${fps} FPS — ${fmtBytes(blob.size)}`;
      progressWrap.classList.add('hidden');
      resultsBox.classList.remove('hidden');
      convertBtn.disabled = false;
      Utils.showToast('Done! Click Download to save your GIF.', 'success');
    });
    gif.render();
  }

  function download() {
    if (!state.blob) return;
    const base = (state.file?.name || 'video').replace(/\.[^.]+$/, '');
    Utils.downloadFile(state.blob, `${base}.gif`, 'image/gif');
  }

  function reset() {
    state.file = null;
    state.blob = null;
    state.duration = 0;
    if (videoEl.src) URL.revokeObjectURL(videoEl.src);
    videoEl.removeAttribute('src');
    videoEl.load();
    if (resultImg._url) URL.revokeObjectURL(resultImg._url);
    resultImg.src = '';
    fileInfo.textContent = '';
    outputInfo.textContent = '';
    [startEl, endEl, widthEl].forEach(el => el.value = el.id === 'v2g-width' ? 480 : '');
    fpsEl.value = '12';
    warning.classList.add('hidden');
    progressWrap.classList.add('hidden');
    resultsBox.classList.add('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  convertBtn.addEventListener('click', convert);
  downloadBtn.addEventListener('click', download);
  resetBtn.addEventListener('click', reset);
})();
