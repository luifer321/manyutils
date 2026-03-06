(function () {
  const baseColorPicker = document.getElementById('base-color');
  const hexInput = document.getElementById('hex-input');
  const harmonySelect = document.getElementById('harmony-type');
  const generateBtn = document.getElementById('generate-btn');
  const randomColorBtn = document.getElementById('random-color-btn');
  const swatchesContainer = document.getElementById('palette-swatches');
  const cssVarsOutput = document.getElementById('css-vars-output');
  const copyVarsBtn = document.getElementById('copy-vars-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');

  let currentPalette = [];

  function hexToHSL(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function generateHarmony(hex, type) {
    const { h, s, l } = hexToHSL(hex);
    const colors = [hex];

    switch (type) {
      case 'complementary':
        colors.push(hslToHex(h + 180, s, l));
        colors.push(hslToHex(h + 180, s * 0.8, Math.min(l + 15, 90)));
        colors.push(hslToHex(h, s * 0.8, Math.min(l + 20, 90)));
        colors.push(hslToHex(h, s * 0.6, Math.max(l - 15, 10)));
        break;

      case 'analogous':
        colors.push(hslToHex(h + 30, s, l));
        colors.push(hslToHex(h + 60, s, l));
        colors.push(hslToHex(h - 30, s, l));
        colors.push(hslToHex(h - 60, s, l));
        break;

      case 'triadic':
        colors.push(hslToHex(h + 120, s, l));
        colors.push(hslToHex(h + 240, s, l));
        colors.push(hslToHex(h + 120, s * 0.7, Math.min(l + 20, 90)));
        colors.push(hslToHex(h + 240, s * 0.7, Math.min(l + 20, 90)));
        break;

      case 'tetradic':
        colors.push(hslToHex(h + 90, s, l));
        colors.push(hslToHex(h + 180, s, l));
        colors.push(hslToHex(h + 270, s, l));
        colors.push(hslToHex(h + 180, s * 0.7, Math.min(l + 15, 90)));
        break;

      case 'monochromatic':
        colors.push(hslToHex(h, s, Math.max(l - 25, 10)));
        colors.push(hslToHex(h, s * 0.75, Math.min(l + 25, 95)));
        colors.push(hslToHex(h, s * 0.5, Math.min(l + 40, 95)));
        colors.push(hslToHex(h, s, Math.max(l - 40, 10)));
        break;
    }

    return colors.slice(0, 5);
  }

  function contrastColor(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? '#1e293b' : '#ffffff';
  }

  function renderPalette() {
    swatchesContainer.innerHTML = '';
    currentPalette.forEach((color, i) => {
      const swatch = document.createElement('div');
      swatch.className = 'flex flex-col items-center cursor-pointer group';
      const textColor = contrastColor(color);
      swatch.innerHTML = `
        <div class="w-full aspect-square rounded-xl border border-slate-200 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm" style="background: ${color};">
          <span class="text-xs font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style="color: ${textColor};">${color}</span>
        </div>
        <span class="mt-2 text-xs font-mono text-slate-600">${color}</span>
      `;
      swatch.addEventListener('click', () => {
        if (typeof Utils !== 'undefined' && Utils.copyToClipboard) {
          Utils.copyToClipboard(color);
          Utils.showToast(`Copied ${color}`, 'success');
        } else {
          navigator.clipboard.writeText(color);
        }
      });
      swatchesContainer.appendChild(swatch);
    });

    const vars = currentPalette.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n');
    cssVarsOutput.textContent = `:root {\n${vars}\n}`;
  }

  function generate() {
    const hex = baseColorPicker.value;
    const harmony = harmonySelect.value;
    currentPalette = generateHarmony(hex, harmony);
    renderPalette();
  }

  function randomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  baseColorPicker.addEventListener('input', () => {
    hexInput.value = baseColorPicker.value;
    generate();
  });

  hexInput.addEventListener('input', () => {
    let val = hexInput.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      baseColorPicker.value = val;
      generate();
    }
  });

  harmonySelect.addEventListener('change', generate);
  generateBtn.addEventListener('click', generate);

  randomColorBtn.addEventListener('click', () => {
    const color = randomHex();
    baseColorPicker.value = color;
    hexInput.value = color;
    generate();
  });

  shuffleBtn.addEventListener('click', () => {
    for (let i = currentPalette.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentPalette[i], currentPalette[j]] = [currentPalette[j], currentPalette[i]];
    }
    renderPalette();
  });

  copyVarsBtn.addEventListener('click', () => {
    const text = cssVarsOutput.textContent;
    if (typeof Utils !== 'undefined' && Utils.copyToClipboard) {
      Utils.copyToClipboard(text);
      Utils.showToast('CSS variables copied!', 'success');
    } else {
      navigator.clipboard.writeText(text);
    }
  });

  generate();
})();
