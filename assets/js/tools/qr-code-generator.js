(function () {
  'use strict';

  const input = document.getElementById('qr-input');
  const sizeSelect = document.getElementById('qr-size');
  const fgColor = document.getElementById('qr-fg-color');
  const bgColor = document.getElementById('qr-bg-color');
  const fgLabel = document.getElementById('qr-fg-label');
  const bgLabel = document.getElementById('qr-bg-label');
  const generateBtn = document.getElementById('qr-generate-btn');
  const downloadBtn = document.getElementById('qr-download-btn');
  const copyBtn = document.getElementById('qr-copy-btn');
  const preview = document.getElementById('qr-preview');
  const output = document.getElementById('qr-output');

  let qrInstance = null;

  fgColor.addEventListener('input', () => {
    fgLabel.textContent = fgColor.value;
  });

  bgColor.addEventListener('input', () => {
    bgLabel.textContent = bgColor.value;
  });

  function generateQR() {
    const text = input.value.trim();
    if (!text) {
      if (typeof Utils !== 'undefined') Utils.showToast('Please enter text or a URL.', 'error');
      return;
    }

    const size = parseInt(sizeSelect.value, 10);

    output.innerHTML = '';

    if (qrInstance) {
      qrInstance = null;
    }

    qrInstance = new QRCode(output, {
      text: text,
      width: size,
      height: size,
      colorDark: fgColor.value,
      colorLight: bgColor.value,
      correctLevel: QRCode.CorrectLevel.H
    });

    preview.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
    copyBtn.classList.remove('hidden');
  }

  function getCanvas() {
    return output.querySelector('canvas');
  }

  function downloadQR() {
    const canvas = getCanvas();
    if (!canvas) return;

    if (typeof Utils !== 'undefined') {
      Utils.downloadCanvas(canvas, 'qr-code.png');
    } else {
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }

  async function copyQR() {
    const canvas = getCanvas();
    if (!canvas) return;

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      if (typeof Utils !== 'undefined') {
        Utils.showToast('QR code copied to clipboard!', 'success');
      }
    } catch {
      if (typeof Utils !== 'undefined') {
        Utils.showToast('Failed to copy. Try downloading instead.', 'error');
      }
    }
  }

  generateBtn.addEventListener('click', generateQR);
  downloadBtn.addEventListener('click', downloadQR);
  copyBtn.addEventListener('click', copyQR);

  generateQR();
})();
