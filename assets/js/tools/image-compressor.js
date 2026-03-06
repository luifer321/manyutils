(function () {
  'use strict';

  const dropZone = document.getElementById('comp-drop');
  const controls = document.getElementById('comp-controls');
  const fileInfo = document.getElementById('comp-file-info');
  const qualitySlider = document.getElementById('comp-quality');
  const qualityValue = document.getElementById('comp-quality-value');
  const formatSelect = document.getElementById('comp-format');
  const maxWidthInput = document.getElementById('comp-max-width');
  const maxHeightInput = document.getElementById('comp-max-height');
  const compressBtn = document.getElementById('comp-compress-btn');
  const results = document.getElementById('comp-results');
  const originalSizeEl = document.getElementById('comp-original-size');
  const compressedSizeEl = document.getElementById('comp-compressed-size');
  const savingsEl = document.getElementById('comp-savings');
  const canvasOriginal = document.getElementById('comp-canvas-original');
  const previewResult = document.getElementById('comp-preview-result');
  const downloadBtn = document.getElementById('comp-download-btn');
  const resetBtn = document.getElementById('comp-reset-btn');

  const ctxOriginal = canvasOriginal.getContext('2d');

  let sourceImage = null;
  let originalFileSize = 0;
  let compressedBlob = null;

  function isLikelyImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    const name = (file.name || '').toLowerCase();
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif)$/i.test(name);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function handleFile(file) {
    if (!isLikelyImageFile(file)) {
      if (typeof Utils !== 'undefined') Utils.showToast('Please select a valid image file.', 'error');
      return;
    }

    originalFileSize = file.size;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        sourceImage = img;
        fileInfo.textContent = file.name + ' — ' + img.naturalWidth + ' × ' + img.naturalHeight + 'px — ' + formatBytes(originalFileSize);

        canvasOriginal.width = img.naturalWidth;
        canvasOriginal.height = img.naturalHeight;
        ctxOriginal.drawImage(img, 0, 0);

        dropZone.classList.add('hidden');
        controls.classList.remove('hidden');
        results.classList.add('hidden');
        compressedBlob = null;
        // Generate an initial preview so users can immediately see output after selecting a file.
        compress();
      };
      img.onerror = function () {
        if (typeof Utils !== 'undefined') {
          Utils.showToast('This image format is not supported by your browser. Try JPG, PNG, or WebP.', 'error');
        }
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      if (typeof Utils !== 'undefined') {
        Utils.showToast('Could not read the selected file. Please try another image.', 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  function compress() {
    if (!sourceImage) return;

    const quality = parseInt(qualitySlider.value, 10) / 100;
    const format = formatSelect.value;
    const maxW = parseInt(maxWidthInput.value, 10) || 0;
    const maxH = parseInt(maxHeightInput.value, 10) || 0;

    let w = sourceImage.naturalWidth;
    let h = sourceImage.naturalHeight;

    if (maxW > 0 && w > maxW) {
      h = Math.round(h * (maxW / w));
      w = maxW;
    }
    if (maxH > 0 && h > maxH) {
      w = Math.round(w * (maxH / h));
      h = maxH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0, w, h);

    canvas.toBlob(function (blob) {
      if (!blob) {
        if (typeof Utils !== 'undefined') Utils.showToast('Compression failed. Try a different format.', 'error');
        return;
      }

      compressedBlob = blob;

      originalSizeEl.textContent = formatBytes(originalFileSize);
      compressedSizeEl.textContent = formatBytes(blob.size);

      const saved = originalFileSize > 0
        ? Math.round((1 - blob.size / originalFileSize) * 100)
        : 0;
      savingsEl.textContent = (saved >= 0 ? saved : 0) + '%';

      const url = URL.createObjectURL(blob);
      previewResult.src = url;

      results.classList.remove('hidden');

      if (typeof Utils !== 'undefined') Utils.showToast('Compression complete!', 'success');
    }, format, quality);
  }

  function downloadCompressed() {
    if (!compressedBlob) return;

    const ext = formatSelect.value === 'image/png' ? '.png'
      : formatSelect.value === 'image/webp' ? '.webp'
      : '.jpg';

    const filename = 'compressed-image' + ext;

    if (typeof Utils !== 'undefined' && Utils.downloadFile) {
      Utils.downloadFile(compressedBlob, filename, compressedBlob.type);
    } else {
      const url = URL.createObjectURL(compressedBlob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  function reset() {
    sourceImage = null;
    originalFileSize = 0;
    compressedBlob = null;
    canvasOriginal.width = 0;
    canvasOriginal.height = 0;
    previewResult.src = '';
    fileInfo.textContent = '';
    qualitySlider.value = 80;
    qualityValue.textContent = '80%';
    maxWidthInput.value = '';
    maxHeightInput.value = '';
    formatSelect.value = 'image/webp';
    results.classList.add('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  if (typeof Utils !== 'undefined' && Utils.setupDropZone) {
    Utils.setupDropZone(dropZone, handleFile);
  } else {
    dropZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', () => {
        if (input.files[0]) handleFile(input.files[0]);
      });
      input.click();
    });

    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
  }

  qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = qualitySlider.value + '%';
  });

  compressBtn.addEventListener('click', compress);
  downloadBtn.addEventListener('click', downloadCompressed);
  resetBtn.addEventListener('click', reset);
})();
