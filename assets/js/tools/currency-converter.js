(function () {
  'use strict';

  const CURRENCIES = {
    USD: { name: 'US Dollar', symbol: '$' },
    EUR: { name: 'Euro', symbol: '€' },
    GBP: { name: 'British Pound', symbol: '£' },
    JPY: { name: 'Japanese Yen', symbol: '¥' },
    CAD: { name: 'Canadian Dollar', symbol: 'CA$' },
    AUD: { name: 'Australian Dollar', symbol: 'A$' },
    CHF: { name: 'Swiss Franc', symbol: 'CHF' },
    CNY: { name: 'Chinese Yuan', symbol: '¥' },
    INR: { name: 'Indian Rupee', symbol: '₹' },
    BRL: { name: 'Brazilian Real', symbol: 'R$' },
    MXN: { name: 'Mexican Peso', symbol: 'MX$' },
    KRW: { name: 'South Korean Won', symbol: '₩' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$' },
    HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
    NOK: { name: 'Norwegian Krone', symbol: 'kr' },
    SEK: { name: 'Swedish Krona', symbol: 'kr' },
    DKK: { name: 'Danish Krone', symbol: 'kr' },
    NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
    ZAR: { name: 'South African Rand', symbol: 'R' },
    TRY: { name: 'Turkish Lira', symbol: '₺' },
    RUB: { name: 'Russian Ruble', symbol: '₽' },
    PLN: { name: 'Polish Zloty', symbol: 'zł' },
    THB: { name: 'Thai Baht', symbol: '฿' },
    IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
    MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
    PHP: { name: 'Philippine Peso', symbol: '₱' },
    CZK: { name: 'Czech Koruna', symbol: 'Kč' },
    ILS: { name: 'Israeli Shekel', symbol: '₪' },
    CLP: { name: 'Chilean Peso', symbol: 'CLP$' },
    ARS: { name: 'Argentine Peso', symbol: 'AR$' },
    COP: { name: 'Colombian Peso', symbol: 'CO$' },
    EGP: { name: 'Egyptian Pound', symbol: 'E£' }
  };

  // Fallback rates relative to USD
  const FALLBACK_RATES = {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36, AUD: 1.53,
    CHF: 0.88, CNY: 7.24, INR: 83.1, BRL: 4.97, MXN: 17.15, KRW: 1325,
    SGD: 1.34, HKD: 7.82, NOK: 10.55, SEK: 10.42, DKK: 6.88, NZD: 1.63,
    ZAR: 18.65, TRY: 30.25, RUB: 91.5, PLN: 4.02, THB: 35.2, IDR: 15650,
    MYR: 4.72, PHP: 56.1, CZK: 22.85, ILS: 3.67, CLP: 895, ARS: 830,
    COP: 3950, EGP: 30.9
  };

  let rates = { ...FALLBACK_RATES };
  let ratesSource = 'fallback';

  const amountInput = document.getElementById('cc-amount');
  const fromSelect = document.getElementById('cc-from');
  const toSelect = document.getElementById('cc-to');
  const swapBtn = document.getElementById('cc-swap-btn');
  const convertBtn = document.getElementById('cc-convert-btn');
  const resultContainer = document.getElementById('cc-result');
  const resultAmount = document.getElementById('cc-result-amount');
  const rateDisplay = document.getElementById('cc-rate-display');
  const pairButtons = document.querySelectorAll('.cc-pair-btn');

  function populateSelect(selectEl, defaultCode) {
    const codes = Object.keys(CURRENCIES);
    selectEl.innerHTML = '';
    codes.forEach(function (code) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code + ' - ' + CURRENCIES[code].name;
      if (code === defaultCode) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  function formatCurrency(value, code) {
    var info = CURRENCIES[code];
    var decimals = (code === 'JPY' || code === 'KRW' || code === 'CLP' || code === 'COP' || code === 'IDR') ? 0 : 2;
    var formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return info.symbol + ' ' + formatted;
  }

  function convert() {
    var amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount < 0) {
      resultContainer.classList.add('hidden');
      return;
    }

    var from = fromSelect.value;
    var to = toSelect.value;

    var rateFrom = rates[from];
    var rateTo = rates[to];

    if (!rateFrom || !rateTo) {
      resultContainer.classList.add('hidden');
      return;
    }

    var inUSD = amount / rateFrom;
    var result = inUSD * rateTo;
    var unitRate = rateTo / rateFrom;

    resultAmount.textContent = formatCurrency(result, to);
    rateDisplay.textContent = '1 ' + from + ' = ' + unitRate.toFixed(6) + ' ' + to;

    if (ratesSource === 'fallback') {
      rateDisplay.textContent += ' (approximate)';
    }

    resultContainer.classList.remove('hidden');
  }

  function fetchRates() {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(function (res) {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(function (data) {
        if (data && data.rates) {
          Object.keys(CURRENCIES).forEach(function (code) {
            if (data.rates[code] !== undefined) {
              rates[code] = data.rates[code];
            }
          });
          ratesSource = 'live';
          convert();
        }
      })
      .catch(function () {
        ratesSource = 'fallback';
      });
  }

  populateSelect(fromSelect, 'USD');
  populateSelect(toSelect, 'EUR');

  amountInput.addEventListener('input', convert);
  fromSelect.addEventListener('change', convert);
  toSelect.addEventListener('change', convert);
  convertBtn.addEventListener('click', convert);

  swapBtn.addEventListener('click', function () {
    var temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    convert();
  });

  pairButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      fromSelect.value = btn.dataset.from;
      toSelect.value = btn.dataset.to;
      convert();
    });
  });

  fetchRates();
  convert();
})();
