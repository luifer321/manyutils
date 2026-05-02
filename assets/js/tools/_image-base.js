/**
 * Shared toolkit for image-based tools (converters, resizer, crop, rotate/flip).
 *
 * Builds the upload → decode → preview → process → download pipeline once.
 * Tool-specific JS calls ImageTool.create({...}) with a config object and gets
 * back the wired UI behaviour for free.
 *
 *   ImageTool.create({
 *     prefix: 'png2jpg',          // dom id prefix (matches the HTML)
 *     accept: 'image/png',        // input accept
 *     outputType: 'image/jpeg',   // canvas.toBlob mime
 *     outputExt: 'jpg',
 *     filenameSuffix: '',         // appended to original name before ext
 *     hasQuality: true,           // show & use the #<prefix>-quality slider
 *     defaultQuality: 90,
 *     fillBackground: '#ffffff',  // for transparent → opaque conversions
 *     accept: 'image/svg+xml',    // SVG-specific accept
 *     processCanvas: (img, opts) => canvas, // optional override
 *   });
 *
 * The HTML page must contain elements with these ids (replace `<prefix>`):
 *   <prefix>-drop          drop zone (data-accept attr too)
 *   <prefix>-controls      controls block (initially .hidden)
 *   <prefix>-file-info     filename / dims / size text
 *   <prefix>-quality       (optional) range input 1–100
 *   <prefix>-quality-value (optional) span showing 'NN%'
 *   <prefix>-process-btn   primary action button
 *   <prefix>-results       results block (initially .hidden)
 *   <prefix>-canvas-preview canvas for original preview
 *   <prefix>-preview-result <img> showing the processed result
 *   <prefix>-original-size  span for original byte size
 *   <prefix>-output-size    span for output byte size
 *   <prefix>-savings        span for savings %
 *   <prefix>-download-btn   download button
 *   <prefix>-reset-btn      reset button
 *
 * Optional extras (only used by the resizer / cropper / rotator):
 *   <prefix>-width, <prefix>-height, <prefix>-keep-ratio, <prefix>-rotate-…, etc.
 */
window.ImageTool = (function () {
  'use strict';

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function isAcceptedFile(file, accept) {
    if (!file) return false;
    if (!accept || accept === '*') return true;
    if (accept.includes('image/svg')) {
      return /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';
    }
    if (accept.startsWith('image/')) {
      const ext = accept.split('/')[1];
      if (file.type === accept) return true;
      const re = new RegExp(`\\.(${ext === 'jpeg' ? 'jpe?g' : ext})$`, 'i');
      return re.test(file.name);
    }
    return file.type && file.type.startsWith('image/');
  }

  function stripExt(name) {
    return (name || 'image').replace(/\.[^.]+$/, '');
  }

  /**
   * Decode an image File into an HTMLImageElement that's been fully loaded.
   * For SVG inputs we read text first so we can also expose the source markup.
   */
  function decodeFile(file, accept) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read-failed'));
      reader.onload = () => {
        const img = new Image();
        // SVG can rely on inline data; CORS isn't an issue for data URLs.
        img.onload = () => resolve({ img, dataUrl: reader.result });
        img.onerror = () => reject(new Error('decode-failed'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Default canvas renderer:
   *   - draws the source at (optionally) target dimensions
   *   - fills a background colour first when the output type is JPEG (no alpha)
   */
  function defaultRender(img, cfg, opts) {
    const w = opts.width  || img.naturalWidth;
    const h = opts.height || img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const fill = cfg.outputType === 'image/jpeg'
      ? (cfg.fillBackground || '#ffffff')
      : null;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) reject(new Error('encode-failed'));
        else resolve(blob);
      }, type, quality);
    });
  }

  /**
   * Wire up an image tool given a config object.
   * Returns the controller so consumers can call .reset(), .reprocess() etc.
   */
  function create(cfg) {
    const $ = id => document.getElementById(`${cfg.prefix}-${id}`);

    const dropZone   = $('drop');
    const controls   = $('controls');
    const fileInfo   = $('file-info');
    const processBtn = $('process-btn');
    const results    = $('results');
    const canvasPrev = $('canvas-preview');
    const previewImg = $('preview-result');
    const origSizeEl = $('original-size');
    const outSizeEl  = $('output-size');
    const savingsEl  = $('savings');
    const downloadBtn= $('download-btn');
    const resetBtn   = $('reset-btn');
    const qualitySl  = $('quality');
    const qualityVal = $('quality-value');

    if (!dropZone || !controls || !processBtn || !results) {
      console.warn(`[ImageTool] required elements missing for prefix "${cfg.prefix}"`);
      return null;
    }

    const state = {
      file: null,
      img: null,
      svgSource: null, // text contents when the input is SVG
      lastBlob: null,
    };

    function showError(msg) {
      if (typeof Utils !== 'undefined' && Utils.showToast) Utils.showToast(msg, 'error');
      else alert(msg);
    }

    function setQualityLabel() {
      if (qualityVal && qualitySl) qualityVal.textContent = qualitySl.value + '%';
    }

    function readFileText(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload  = () => resolve(r.result);
        r.onerror = () => reject(new Error('read-failed'));
        r.readAsText(file);
      });
    }

    async function handleFile(file) {
      if (!isAcceptedFile(file, cfg.accept)) {
        showError(cfg.errorWrongType || 'Unsupported file type. Please pick a different file.');
        return;
      }
      try {
        state.file = file;

        // For SVG, also keep the source text — useful for size-aware rendering.
        if (cfg.accept === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
          state.svgSource = await readFileText(file);
        } else {
          state.svgSource = null;
        }

        const { img } = await decodeFile(file, cfg.accept);
        state.img = img;

        if (canvasPrev) {
          const ctx = canvasPrev.getContext('2d');
          canvasPrev.width  = img.naturalWidth  || 800;
          canvasPrev.height = img.naturalHeight || 600;
          ctx.drawImage(img, 0, 0, canvasPrev.width, canvasPrev.height);
        }

        if (fileInfo) {
          fileInfo.textContent =
            `${file.name} — ${img.naturalWidth || '?'} × ${img.naturalHeight || '?'}px — ${formatBytes(file.size)}`;
        }

        dropZone.classList.add('hidden');
        controls.classList.remove('hidden');
        results.classList.add('hidden');

        // For tools that pre-fill width/height from the source image
        if (typeof cfg.onLoaded === 'function') cfg.onLoaded(state, $);

        // Generate an initial preview right away — same as image-compressor does.
        if (cfg.autoProcess !== false) await process();
      } catch (err) {
        console.warn('[ImageTool]', err);
        showError(cfg.errorDecode || 'Could not read this file. Please try another image.');
      }
    }

    async function process() {
      if (!state.img) return;
      try {
        const opts = {};
        opts.quality = qualitySl ? parseInt(qualitySl.value, 10) / 100 : (cfg.defaultQuality / 100);
        if (typeof cfg.collectOptions === 'function') {
          Object.assign(opts, cfg.collectOptions(state, $) || {});
        }

        const canvas = (typeof cfg.processCanvas === 'function')
          ? cfg.processCanvas(state.img, cfg, opts, state)
          : defaultRender(state.img, cfg, opts);

        const blob = await canvasToBlob(canvas, cfg.outputType, opts.quality);
        state.lastBlob = blob;

        if (origSizeEl) origSizeEl.textContent = formatBytes(state.file.size);
        if (outSizeEl)  outSizeEl.textContent  = formatBytes(blob.size);
        if (savingsEl) {
          const saved = state.file.size > 0
            ? Math.round((1 - blob.size / state.file.size) * 100)
            : 0;
          savingsEl.textContent = (saved > 0 ? saved : 0) + '%';
        }

        if (previewImg) {
          if (previewImg._url) URL.revokeObjectURL(previewImg._url);
          previewImg._url = URL.createObjectURL(blob);
          previewImg.src  = previewImg._url;
        }
        results.classList.remove('hidden');
      } catch (err) {
        console.warn('[ImageTool] process', err);
        showError(cfg.errorProcess || 'Conversion failed. Try another file or different settings.');
      }
    }

    function download() {
      if (!state.lastBlob) return;
      const base = stripExt(state.file?.name) + (cfg.filenameSuffix || '');
      const filename = `${base}.${cfg.outputExt}`;
      if (typeof Utils !== 'undefined' && Utils.downloadFile) {
        Utils.downloadFile(state.lastBlob, filename, state.lastBlob.type);
      } else {
        const url = URL.createObjectURL(state.lastBlob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }
    }

    function reset() {
      state.file = null;
      state.img = null;
      state.svgSource = null;
      state.lastBlob = null;
      if (canvasPrev) { canvasPrev.width = 0; canvasPrev.height = 0; }
      if (previewImg) {
        if (previewImg._url) URL.revokeObjectURL(previewImg._url);
        previewImg.src = '';
      }
      if (fileInfo) fileInfo.textContent = '';
      if (qualitySl) qualitySl.value = cfg.defaultQuality || 90;
      setQualityLabel();
      results.classList.add('hidden');
      controls.classList.add('hidden');
      dropZone.classList.remove('hidden');
      if (typeof cfg.onReset === 'function') cfg.onReset(state, $);
    }

    // Wire events
    if (typeof Utils !== 'undefined' && Utils.setupDropZone) {
      Utils.setupDropZone(dropZone, handleFile);
    }

    if (qualitySl) {
      qualitySl.addEventListener('input', setQualityLabel);
      setQualityLabel();
    }
    processBtn.addEventListener('click', process);
    if (downloadBtn) downloadBtn.addEventListener('click', download);
    if (resetBtn)    resetBtn.addEventListener('click', reset);

    // Optional extra reactive controls (e.g. width/height inputs)
    if (Array.isArray(cfg.reactOn)) {
      cfg.reactOn.forEach(id => {
        const el = $(id);
        if (el) el.addEventListener('input', () => { if (state.img) process(); });
      });
    }

    return { state, process, reset, download, $ };
  }

  return { create, formatBytes, stripExt, isAcceptedFile };
})();
