(function () {
  const preview = document.getElementById('gradient-preview');
  const typeSelect = document.getElementById('gradient-type');
  const angleSlider = document.getElementById('gradient-angle');
  const angleValue = document.getElementById('angle-value');
  const angleControl = document.getElementById('angle-control');
  const stopsContainer = document.getElementById('color-stops');
  const addStopBtn = document.getElementById('add-stop-btn');
  const copyCssBtn = document.getElementById('copy-css-btn');
  const randomBtn = document.getElementById('random-btn');
  const cssOutput = document.getElementById('css-output');
  const presetsContainer = document.getElementById('presets');

  let stops = [
    { color: '#6366f1', position: 0 },
    { color: '#ec4899', position: 100 }
  ];

  const presets = [
    { type: 'linear', angle: 135, stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }] },
    { type: 'linear', angle: 90, stops: [{ color: '#f093fb', position: 0 }, { color: '#f5576c', position: 100 }] },
    { type: 'linear', angle: 45, stops: [{ color: '#4facfe', position: 0 }, { color: '#00f2fe', position: 100 }] },
    { type: 'linear', angle: 160, stops: [{ color: '#0ba360', position: 0 }, { color: '#3cba92', position: 50 }, { color: '#30dd8a', position: 100 }] },
    { type: 'linear', angle: 90, stops: [{ color: '#fa709a', position: 0 }, { color: '#fee140', position: 100 }] }
  ];

  function randomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  function buildGradientCSS() {
    const type = typeSelect.value;
    const angle = parseInt(angleSlider.value, 10);
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const colorList = sorted.map(s => `${s.color} ${s.position}%`).join(', ');

    if (type === 'linear') return `linear-gradient(${angle}deg, ${colorList})`;
    if (type === 'radial') return `radial-gradient(circle, ${colorList})`;
    return `conic-gradient(from ${angle}deg, ${colorList})`;
  }

  function updatePreview() {
    const css = buildGradientCSS();
    preview.style.background = css;
    cssOutput.textContent = `background: ${css};`;
  }

  function renderStops() {
    stopsContainer.innerHTML = '';
    stops.forEach((stop, i) => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3';

      row.innerHTML = `
        <input type="color" value="${stop.color}" data-index="${i}" class="stop-color w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 flex-shrink-0">
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-slate-500">Position</span>
            <span class="text-xs font-medium text-slate-700">${stop.position}%</span>
          </div>
          <input type="range" min="0" max="100" value="${stop.position}" data-index="${i}" class="stop-position w-full accent-primary-500">
        </div>
        ${stops.length > 2
          ? `<button data-index="${i}" class="remove-stop p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>`
          : ''}
      `;
      stopsContainer.appendChild(row);
    });

    addStopBtn.style.display = stops.length >= 5 ? 'none' : '';
    bindStopEvents();
    updatePreview();
  }

  function bindStopEvents() {
    stopsContainer.querySelectorAll('.stop-color').forEach(el => {
      el.addEventListener('input', e => {
        stops[parseInt(e.target.dataset.index, 10)].color = e.target.value;
        updatePreview();
      });
    });

    stopsContainer.querySelectorAll('.stop-position').forEach(el => {
      el.addEventListener('input', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        stops[idx].position = parseInt(e.target.value, 10);
        e.target.previousElementSibling.querySelector('.font-medium').textContent = e.target.value + '%';
        updatePreview();
      });
    });

    stopsContainer.querySelectorAll('.remove-stop').forEach(el => {
      el.addEventListener('click', e => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        stops.splice(idx, 1);
        renderStops();
      });
    });
  }

  function renderPresets() {
    presetsContainer.innerHTML = '';
    presets.forEach((preset, i) => {
      const sorted = [...preset.stops].sort((a, b) => a.position - b.position);
      const colorList = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
      let bg;
      if (preset.type === 'linear') bg = `linear-gradient(${preset.angle}deg, ${colorList})`;
      else if (preset.type === 'radial') bg = `radial-gradient(circle, ${colorList})`;
      else bg = `conic-gradient(from ${preset.angle}deg, ${colorList})`;

      const btn = document.createElement('button');
      btn.className = 'h-16 rounded-xl border border-slate-200 hover:scale-105 transition-transform cursor-pointer';
      btn.style.background = bg;
      btn.title = `Preset ${i + 1}`;
      btn.addEventListener('click', () => {
        typeSelect.value = preset.type;
        angleSlider.value = preset.angle;
        angleValue.textContent = preset.angle;
        stops = preset.stops.map(s => ({ ...s }));
        handleTypeChange();
        renderStops();
      });
      presetsContainer.appendChild(btn);
    });
  }

  function handleTypeChange() {
    const type = typeSelect.value;
    angleControl.style.display = type === 'radial' ? 'none' : '';
    updatePreview();
  }

  typeSelect.addEventListener('change', handleTypeChange);

  angleSlider.addEventListener('input', () => {
    angleValue.textContent = angleSlider.value;
    updatePreview();
  });

  addStopBtn.addEventListener('click', () => {
    if (stops.length >= 5) return;
    const lastPos = stops[stops.length - 1].position;
    const newPos = Math.min(100, lastPos + Math.round((100 - lastPos) / 2));
    stops.push({ color: randomHex(), position: newPos });
    renderStops();
  });

  copyCssBtn.addEventListener('click', () => {
    const text = cssOutput.textContent;
    if (typeof Utils !== 'undefined' && Utils.copyToClipboard) {
      Utils.copyToClipboard(text);
      Utils.showToast('CSS copied to clipboard!', 'success');
    } else {
      navigator.clipboard.writeText(text);
    }
  });

  randomBtn.addEventListener('click', () => {
    const count = 2 + Math.floor(Math.random() * 2);
    stops = [];
    for (let i = 0; i < count; i++) {
      stops.push({ color: randomHex(), position: Math.round((i / (count - 1)) * 100) });
    }
    angleSlider.value = Math.floor(Math.random() * 360);
    angleValue.textContent = angleSlider.value;
    renderStops();
  });

  renderPresets();
  renderStops();
})();
