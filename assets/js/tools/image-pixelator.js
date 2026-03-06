(function () {
  'use strict';

  const dropZone = document.getElementById('pix-drop');
  const controls = document.getElementById('pix-controls');
  const fileInfo = document.getElementById('pix-file-info');
  const sizeSlider = document.getElementById('pix-size');
  const sizeValue = document.getElementById('pix-size-value');
  const canvasOriginal = document.getElementById('pix-canvas-original');
  const canvasResult = document.getElementById('pix-canvas-result');
  const downloadBtn = document.getElementById('pix-download-btn');
  const resetBtn = document.getElementById('pix-reset-btn');

  const ctxOriginal = canvasOriginal.getContext('2d');
  const ctxResult = canvasResult.getContext('2d');

  let sourceImage = null;

  function isLikelyImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    const name = (file.name || '').toLowerCase();
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif)$/i.test(name);
  }

  function handleFile(file) {
    if (!isLikelyImageFile(file)) {
      if (typeof Utils !== 'undefined') Utils.showToast('Please select a valid image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        sourceImage = img;
        fileInfo.textContent = file.name + ' — ' + img.naturalWidth + ' × ' + img.naturalHeight + 'px';
        drawOriginal();
        pixelate();
        dropZone.classList.add('hidden');
        controls.classList.remove('hidden');
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

  function drawOriginal() {
    canvasOriginal.width = sourceImage.naturalWidth;
    canvasOriginal.height = sourceImage.naturalHeight;
    ctxOriginal.drawImage(sourceImage, 0, 0);
  }

  function pixelate() {
    if (!sourceImage) return;

    const w = sourceImage.naturalWidth;
    const h = sourceImage.naturalHeight;
    const size = parseInt(sizeSlider.value, 10);

    const smallW = Math.max(1, Math.ceil(w / size));
    const smallH = Math.max(1, Math.ceil(h / size));

    canvasResult.width = w;
    canvasResult.height = h;

    ctxResult.imageSmoothingEnabled = false;
    ctxResult.drawImage(sourceImage, 0, 0, smallW, smallH);
    ctxResult.drawImage(canvasResult, 0, 0, smallW, smallH, 0, 0, w, h);
  }

  function reset() {
    sourceImage = null;
    canvasOriginal.width = 0;
    canvasOriginal.height = 0;
    canvasResult.width = 0;
    canvasResult.height = 0;
    fileInfo.textContent = '';
    sizeSlider.value = 10;
    sizeValue.textContent = '10px';
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

  sizeSlider.addEventListener('input', () => {
    sizeValue.textContent = sizeSlider.value + 'px';
    pixelate();
  });

  downloadBtn.addEventListener('click', () => {
    if (typeof Utils !== 'undefined' && Utils.downloadCanvas) {
      Utils.downloadCanvas(canvasResult, 'pixelated-image.png');
    } else {
      const link = document.createElement('a');
      link.download = 'pixelated-image.png';
      link.href = canvasResult.toDataURL('image/png');
      link.click();
    }
  });

  resetBtn.addEventListener('click', reset);
})();
