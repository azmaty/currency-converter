const CURRENCIES = {
  BTC: { name: 'Bitcoin', flag: '₿' },
  USD: { name: 'US Dollar', flag: '🇺🇸' },
  EUR: { name: 'Euro', flag: '🇪🇺' },
  GBP: { name: 'British Pound', flag: '🇬🇧' },
  JPY: { name: 'Japanese Yen', flag: '🇯🇵' },
  CAD: { name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { name: 'Australian Dollar', flag: '🇦🇺' },
  CHF: { name: 'Swiss Franc', flag: '🇨🇭' },
  CNY: { name: 'Chinese Yuan', flag: '🇨🇳' },
  INR: { name: 'Indian Rupee', flag: '🇮🇳' },
  MXN: { name: 'Mexican Peso', flag: '🇲🇽' },
  BRL: { name: 'Brazilian Real', flag: '🇧🇷' },
  KRW: { name: 'South Korean Won', flag: '🇰🇷' },
  SGD: { name: 'Singapore Dollar', flag: '🇸🇬' },
  HKD: { name: 'Hong Kong Dollar', flag: '🇭🇰' },
  NOK: { name: 'Norwegian Krone', flag: '🇳🇴' },
  SEK: { name: 'Swedish Krona', flag: '🇸🇪' },
  DKK: { name: 'Danish Krone', flag: '🇩🇰' },
  NZD: { name: 'New Zealand Dollar', flag: '🇳🇿' },
  ZAR: { name: 'South African Rand', flag: '🇿🇦' },
  TRY: { name: 'Turkish Lira', flag: '🇹🇷' },
  THB: { name: 'Thai Baht', flag: '🇹🇭' },
  PLN: { name: 'Polish Zloty', flag: '🇵🇱' },
  TWD: { name: 'Taiwan Dollar', flag: '🇹🇼' },
  SAR: { name: 'Saudi Riyal', flag: '🇸🇦' },
  AED: { name: 'UAE Dirham', flag: '🇦🇪' },
  CZK: { name: 'Czech Koruna', flag: '🇨🇿' },
  ILS: { name: 'Israeli Shekel', flag: '🇮🇱' },
  PHP: { name: 'Philippine Peso', flag: '🇵🇭' },
  CLP: { name: 'Chilean Peso', flag: '🇨🇱' },
  EGP: { name: 'Egyptian Pound', flag: '🇪🇬' },
  NGN: { name: 'Nigerian Naira', flag: '🇳🇬' },
  COP: { name: 'Colombian Peso', flag: '🇨🇴' },
  PKR: { name: 'Pakistani Rupee', flag: '🇵🇰' },
  MYR: { name: 'Malaysian Ringgit', flag: '🇲🇾' },
  IDR: { name: 'Indonesian Rupiah', flag: '🇮🇩' },
  HUF: { name: 'Hungarian Forint', flag: '🇭🇺' },
  RON: { name: 'Romanian Leu', flag: '🇷🇴' },
  BGN: { name: 'Bulgarian Lev', flag: '🇧🇬' },
  ARS: { name: 'Argentine Peso', flag: '🇦🇷' },
  KWD: { name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  QAR: { name: 'Qatari Riyal', flag: '🇶🇦' },
};

const DEFAULT_FROM = 'USD';
const DEFAULT_TARGETS = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'INR', 'AED', 'SAR', 'BTC'];

let rates = {};
let fromCurrency = localStorage.getItem('fromCurrency') || DEFAULT_FROM;
let selectedTargets = JSON.parse(localStorage.getItem('targets') || 'null') || [...DEFAULT_TARGETS];

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const resultsDiv = document.getElementById('results');
const lastUpdatedEl = document.getElementById('lastUpdated');
const modalOverlay = document.getElementById('modalOverlay');
const currencyListEl = document.getElementById('currencyList');
const modalSearch = document.getElementById('modalSearch');

function populateFromSelect() {
  fromSelect.innerHTML = '';
  for (const [code, info] of Object.entries(CURRENCIES)) {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${info.flag} ${code}`;
    if (code === fromCurrency) opt.selected = true;
    fromSelect.appendChild(opt);
  }
}

function formatNumber(num, code) {
  if (num >= 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (num >= 1) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  if (num >= 0.0001) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
}

function renderResults() {
  const amount = parseFloat(amountInput.value) || 0;
  const baseRate = rates[fromCurrency];

  if (!baseRate) {
    resultsDiv.innerHTML = '<div class="error-msg">Unable to load rates. Pull down to retry.</div>';
    return;
  }

  const targets = selectedTargets.filter(c => c !== fromCurrency);

  if (targets.length === 0) {
    resultsDiv.innerHTML = '<div class="error-msg">No target currencies selected. Tap "Manage currencies" to add some.</div>';
    return;
  }

  resultsDiv.innerHTML = targets.map(code => {
    const info = CURRENCIES[code] || { name: code, flag: '' };
    const rate = rates[code] / baseRate;
    const converted = amount * rate;

    return `
      <div class="result-card" data-code="${code}">
        <div class="result-left">
          <span class="result-flag">${info.flag}</span>
          <div>
            <div class="result-code">${code}</div>
            <div class="result-name">${info.name}</div>
          </div>
        </div>
        <div class="result-right">
          <div class="result-value">${formatNumber(converted, code)}</div>
          <div class="result-rate">1 ${fromCurrency} = ${formatNumber(rate, code)} ${code}</div>
        </div>
      </div>
    `;
  }).join('');

  // Tap a result card to swap it as the "from" currency
  resultsDiv.querySelectorAll('.result-card').forEach(card => {
    card.addEventListener('click', () => {
      const code = card.dataset.code;
      const currentAmount = parseFloat(amountInput.value) || 0;
      const baseR = rates[fromCurrency];
      const targetR = rates[code];
      if (baseR && targetR) {
        amountInput.value = formatNumber(currentAmount * targetR / baseR, code).replace(/,/g, '');
      }
      fromCurrency = code;
      localStorage.setItem('fromCurrency', code);
      fromSelect.value = code;
      renderResults();
    });
  });
}

async function fetchRates() {
  try {
    // Try cache first
    const cached = localStorage.getItem('ratesCache');
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      if (age < 3600000) { // 1 hour
        rates = parsed.rates;
        lastUpdatedEl.textContent = `Updated ${new Date(parsed.timestamp).toLocaleTimeString()}`;
        renderResults();
        return;
      }
    }

    // Fetch fiat rates and BTC price in parallel
    const [fiatRes, btcRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD'),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
    ]);
    if (!fiatRes.ok) throw new Error('API error');
    const fiatData = await fiatRes.json();

    rates = fiatData.rates;

    // Add BTC as an inverse rate (how many BTC per 1 USD)
    if (btcRes.ok) {
      const btcData = await btcRes.json();
      const btcPriceUsd = btcData?.bitcoin?.usd;
      if (btcPriceUsd) {
        rates.BTC = 1 / btcPriceUsd;
      }
    }

    const now = Date.now();
    localStorage.setItem('ratesCache', JSON.stringify({ rates, timestamp: now }));
    lastUpdatedEl.textContent = `Updated ${new Date(now).toLocaleTimeString()}`;
    renderResults();
  } catch (err) {
    // Fallback to any cached data
    const cached = localStorage.getItem('ratesCache');
    if (cached) {
      const parsed = JSON.parse(cached);
      rates = parsed.rates;
      lastUpdatedEl.textContent = `Offline — cached from ${new Date(parsed.timestamp).toLocaleString()}`;
      renderResults();
    } else {
      resultsDiv.innerHTML = '<div class="error-msg">Could not fetch exchange rates. Check your connection and try again.</div>';
      lastUpdatedEl.textContent = 'No connection';
    }
  }
}

// Modal management
function openModal() {
  modalSearch.value = '';
  renderCurrencyList();
  modalOverlay.classList.add('open');
  setTimeout(() => modalSearch.focus(), 300);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  localStorage.setItem('targets', JSON.stringify(selectedTargets));
  renderResults();
}

function renderCurrencyList(filter = '') {
  const search = filter.toLowerCase();
  currencyListEl.innerHTML = Object.entries(CURRENCIES)
    .filter(([code, info]) =>
      code.toLowerCase().includes(search) || info.name.toLowerCase().includes(search)
    )
    .map(([code, info]) => {
      const selected = selectedTargets.includes(code) ? 'selected' : '';
      return `
        <button class="currency-option ${selected}" data-code="${code}">
          <span class="flag">${info.flag}</span>
          <span class="code">${code}</span>
          <span class="name">${info.name}</span>
          <span class="check">${selected ? '✓' : ''}</span>
        </button>
      `;
    }).join('');

  currencyListEl.querySelectorAll('.currency-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      if (selectedTargets.includes(code)) {
        selectedTargets = selectedTargets.filter(c => c !== code);
      } else {
        selectedTargets.push(code);
      }
      renderCurrencyList(modalSearch.value);
    });
  });
}

// Events
amountInput.addEventListener('input', renderResults);
fromSelect.addEventListener('change', () => {
  fromCurrency = fromSelect.value;
  localStorage.setItem('fromCurrency', fromCurrency);
  renderResults();
});

document.getElementById('manageCurrencies').addEventListener('click', openModal);
document.getElementById('modalDone').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
modalSearch.addEventListener('input', () => renderCurrencyList(modalSearch.value));

// Init
populateFromSelect();
fetchRates();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
