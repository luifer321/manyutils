(function () {
  'use strict';

  var startInput = document.getElementById('dbd-start');
  var endInput = document.getElementById('dbd-end');
  var startTodayBtn = document.getElementById('dbd-start-today');
  var endTodayBtn = document.getElementById('dbd-end-today');
  var swapBtn = document.getElementById('dbd-swap-btn');
  var calcBtn = document.getElementById('dbd-calc-btn');
  var resultsContainer = document.getElementById('dbd-results');
  var statusContainer = document.getElementById('dbd-status');
  var statusBadge = document.getElementById('dbd-status-badge');

  var daysEl = document.getElementById('dbd-days');
  var weeksEl = document.getElementById('dbd-weeks');
  var monthsEl = document.getElementById('dbd-months');
  var businessEl = document.getElementById('dbd-business');
  var weekendsEl = document.getElementById('dbd-weekends');
  var hoursEl = document.getElementById('dbd-hours');

  var startPicker = null;
  var endPicker = null;
  var MIN_YEAR = 1950;
  var MAX_YEAR = 2050;
  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  function toDateString(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function setInputDate(input, picker, value, triggerChange) {
    if (picker) {
      picker.setDate(value, !!triggerChange, 'Y-m-d');
      return;
    }
    input.value = value;
  }

  function setDefaults() {
    var today = new Date();
    var future = new Date(today);
    future.setDate(future.getDate() + 30);
    setInputDate(startInput, startPicker, toDateString(today), false);
    setInputDate(endInput, endPicker, toDateString(future), false);
  }

  function ensureYearOption(select, year) {
    var yearStr = String(year);
    var exists = Array.prototype.some.call(select.options, function (opt) {
      return opt.value === yearStr;
    });
    if (!exists) {
      var option = document.createElement('option');
      option.value = yearStr;
      option.textContent = yearStr;
      select.appendChild(option);
    }
  }

  function buildCustomHeader(instance) {
    if (!instance || !instance.calendarContainer) return;

    var currentMonthContainer = instance.calendarContainer.querySelector('.flatpickr-current-month');
    if (!currentMonthContainer) return;

    var existing = currentMonthContainer.querySelector('.dbd-flatpickr-controls');
    if (existing) return;

    instance.calendarContainer.classList.add('dbd-flatpickr-custom');

    var controls = document.createElement('div');
    controls.className = 'dbd-flatpickr-controls';

    var monthSelect = document.createElement('select');
    monthSelect.className = 'dbd-flatpickr-select';
    monthSelect.setAttribute('aria-label', 'Select month');
    monthSelect.title = 'Select month';

    MONTH_NAMES.forEach(function (name, index) {
      var option = document.createElement('option');
      option.value = String(index);
      option.textContent = name;
      monthSelect.appendChild(option);
    });

    var yearSelect = document.createElement('select');
    yearSelect.className = 'dbd-flatpickr-select dbd-flatpickr-year-select';
    yearSelect.setAttribute('aria-label', 'Select year');
    yearSelect.title = 'Select year';

    for (var year = MIN_YEAR; year <= MAX_YEAR; year++) {
      var option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.appendChild(option);
    }

    function syncFromPicker() {
      monthSelect.value = String(instance.currentMonth);
      ensureYearOption(yearSelect, instance.currentYear);
      yearSelect.value = String(instance.currentYear);
    }

    monthSelect.addEventListener('change', function () {
      var targetMonth = parseInt(monthSelect.value, 10);
      if (!Number.isNaN(targetMonth)) {
        instance.changeMonth(targetMonth - instance.currentMonth);
      }
    });

    yearSelect.addEventListener('change', function () {
      var targetYear = parseInt(yearSelect.value, 10);
      if (!Number.isNaN(targetYear)) {
        instance.changeYear(targetYear);
      }
    });

    controls.appendChild(monthSelect);
    controls.appendChild(yearSelect);
    currentMonthContainer.appendChild(controls);
    syncFromPicker();

    instance.config.onMonthChange.push(syncFromPicker);
    instance.config.onYearChange.push(syncFromPicker);
    instance.config.onValueUpdate.push(syncFromPicker);
  }

  function initDatePickers() {
    if (typeof flatpickr !== 'function') return;

    var common = {
      dateFormat: 'Y-m-d',
      allowInput: true,
      disableMobile: true,
      monthSelectorType: 'static',
    };

    startPicker = flatpickr(startInput, Object.assign({}, common, {
      onReady: [function (_, __, instance) { buildCustomHeader(instance); }],
      onChange: [calculate],
    }));

    endPicker = flatpickr(endInput, Object.assign({}, common, {
      onReady: [function (_, __, instance) { buildCustomHeader(instance); }],
      onChange: [calculate],
    }));
  }

  function countBusinessAndWeekendDays(start, end) {
    var businessDays = 0;
    var weekendDays = 0;
    var current = new Date(start);
    current.setDate(current.getDate() + 1);

    while (current <= end) {
      var day = current.getDay();
      if (day === 0 || day === 6) {
        weekendDays++;
      } else {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    return { business: businessDays, weekends: weekendDays };
  }

  function fmt(n) {
    return typeof Utils !== 'undefined' ? Utils.formatNumber(n) : n.toLocaleString();
  }

  function t(key, fallback) {
    if (typeof i18n !== 'undefined' && typeof i18n.t === 'function') {
      return i18n.t(key) || fallback;
    }
    return fallback;
  }

  function tf(key, vars, fallback) {
    var template = t(key, fallback);
    return Object.keys(vars || {}).reduce(function (acc, k) {
      return acc.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
    }, template);
  }

  function calculate() {
    if (!startInput.value || !endInput.value) {
      resultsContainer.classList.add('hidden');
      statusContainer.classList.add('hidden');
      return;
    }

    var startDate = new Date(startInput.value + 'T00:00:00');
    var endDate = new Date(endInput.value + 'T00:00:00');

    var diffMs = endDate.getTime() - startDate.getTime();
    var isNegative = diffMs < 0;
    var absDiffMs = Math.abs(diffMs);

    var totalDays = Math.round(absDiffMs / (1000 * 60 * 60 * 24));
    var weeks = Math.floor(totalDays / 7);
    var remainingDays = totalDays % 7;
    var approxMonths = (totalDays / 30.44).toFixed(1);
    var totalHours = totalDays * 24;

    var earlier = isNegative ? endDate : startDate;
    var later = isNegative ? startDate : endDate;
    var bwd = countBusinessAndWeekendDays(earlier, later);

    daysEl.textContent = fmt(totalDays);
    weeksEl.textContent = tf(
      'tools.days_between_dates.ui.weeks_days_format_short',
      { weeks: fmt(weeks), days: fmt(remainingDays) },
      fmt(weeks) + 'w ' + fmt(remainingDays) + 'd'
    );
    monthsEl.textContent = approxMonths;
    businessEl.textContent = fmt(bwd.business);
    weekendsEl.textContent = fmt(bwd.weekends);
    hoursEl.textContent = fmt(totalHours);

    // Status badge
    statusContainer.classList.remove('hidden');
    if (totalDays === 0) {
      statusBadge.textContent = t('tools.days_between_dates.ui.status_same_date', 'Same date');
      statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700';
    } else if (isNegative) {
      statusBadge.textContent = tf(
        'tools.days_between_dates.ui.status_end_before_start',
        { days: fmt(totalDays) },
        'End date is before start date (' + fmt(totalDays) + ' days ago)'
      );
      statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-700';
    } else {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate < today) {
        statusBadge.textContent = t('tools.days_between_dates.ui.status_both_past', 'Both dates are in the past');
        statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600';
      } else {
        statusBadge.textContent = tf(
          'tools.days_between_dates.ui.status_end_in_future',
          { days: fmt(totalDays) },
          'End date is ' + fmt(totalDays) + ' days in the future'
        );
        statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700';
      }
    }

    resultsContainer.classList.remove('hidden');
  }

  initDatePickers();
  setDefaults();

  startInput.addEventListener('change', calculate);
  endInput.addEventListener('change', calculate);
  calcBtn.addEventListener('click', calculate);
  document.addEventListener('manyutils:language-changed', calculate);

  swapBtn.addEventListener('click', function () {
    var temp = startInput.value;
    setInputDate(startInput, startPicker, endInput.value, false);
    setInputDate(endInput, endPicker, temp, false);
    calculate();
  });

  startTodayBtn.addEventListener('click', function () {
    setInputDate(startInput, startPicker, toDateString(new Date()), false);
    calculate();
  });

  endTodayBtn.addEventListener('click', function () {
    setInputDate(endInput, endPicker, toDateString(new Date()), false);
    calculate();
  });

  calculate();
})();
