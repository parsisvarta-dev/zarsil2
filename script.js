// ZARSIL V14 - Live API + Working Tools

const API_BASE = 'https://api.priceto.day/v1/latest/irr';

function toToman(rial) {
  if (!rial && rial !== 0) return '—';
  const toman = Math.round(Number(rial) / 10);
  return toman.toLocaleString('fa-IR');
}

function formatChange(current, high, low) {
  if (!current || !low) return { text: '', className: '' };
  const diff = current - low;
  const pct = ((diff / low) * 100).toFixed(1);
  const sign = diff >= 0 ? '▲' : '▼';
  const cls = diff >= 0 ? '' : ' down';
  return {
    text: `${sign} ${diff >= 0 ? '+' : ''}${pct}٪`,
    className: cls
  };
}

const ASSETS = {
  silver: {
    name: 'نقره',
    unit: 'قیمت لحظه‌ای هر اونس (تومان)',
    emoji: '🥈',
    symbol: 'silver-ounce',
    chartTitle: 'نمودار قیمت نقره',
    trendTitle: 'روند بازار نقره',
    globalTitle: 'بازار جهانی نقره'
  },
  gold: {
    name: 'طلا',
    unit: 'قیمت لحظه‌ای هر گرم ۱۸ عیار (تومان)',
    emoji: '🥇',
    symbol: 'gold-18k',
    chartTitle: 'نمودار قیمت طلا',
    trendTitle: 'روند بازار طلا',
    globalTitle: 'بازار جهانی طلا'
  },
  dollar: {
    name: 'دلار',
    unit: 'نرخ لحظه‌ای دلار آزاد (تومان)',
    emoji: '💲',
    symbol: 'usd',
    chartTitle: 'نمودار نرخ دلار',
    trendTitle: 'روند بازار دلار',
    globalTitle: 'نرخ دلار'
  }
};

const priceCache = {};
let lastGoldPrice = null; // store for calculators

async function fetchPrice(symbol) {
  if (priceCache[symbol] && Date.now() - priceCache[symbol].ts < 60000) {
    return priceCache[symbol].data;
  }
  try {
    const res = await fetch(`${API_BASE}/${symbol}`);
    const data = await res.json();
    if (data.success) {
      priceCache[symbol] = { data, ts: Date.now() };
      return data;
    }
  } catch (e) {
    console.warn('API error', symbol, e);
  }
  return null;
}

async function updateAsset(key) {
  const asset = ASSETS[key];
  if (!asset) return;

  document.getElementById('asset-name').textContent = asset.name;
  document.getElementById('asset-unit').textContent = asset.unit;
  document.getElementById('asset-emoji').textContent = asset.emoji;
  document.getElementById('chart-title').textContent = asset.chartTitle;
  document.getElementById('trend-title').textContent = asset.trendTitle;
  document.getElementById('global-title').textContent = asset.globalTitle;

  document.getElementById('price-value').textContent = '...';
  document.getElementById('price-change').textContent = 'در حال دریافت...';

  const data = await fetchPrice(asset.symbol);

  if (data) {
    const tomanPrice = Math.round(data.price / 10);
    document.getElementById('price-value').textContent = toToman(data.price);

    const change = formatChange(data.price, data.high, data.low);
    const changeEl = document.getElementById('price-change');
    changeEl.textContent = change.text + '  امروز';
    changeEl.className = 'price-change' + change.className;

    document.getElementById('meta-low').textContent = toToman(data.low);
    document.getElementById('meta-high').textContent = toToman(data.high);
    document.getElementById('meta-yesterday').textContent = toToman(data.low);
    document.getElementById('meta-monthly').textContent = '—';

    document.getElementById('global-price').textContent = toToman(data.price);
    document.getElementById('global-change').textContent = change.text;

    // Simple variation for cities
    const base = tomanPrice;
    document.getElementById('city-ny').textContent = (base * 0.998).toLocaleString('fa-IR');
    document.getElementById('city-lon').textContent = (base * 1.001).toLocaleString('fa-IR');
    document.getElementById('city-tok').textContent = (base * 0.997).toLocaleString('fa-IR');
    document.getElementById('city-dxb').textContent = (base * 1.002).toLocaleString('fa-IR');
    document.getElementById('city-ny-c').textContent = change.text;
    document.getElementById('city-lon-c').textContent = change.text;
    document.getElementById('city-tok-c').textContent = change.text;
    document.getElementById('city-dxb-c').textContent = change.text;

    if (key === 'gold') {
      lastGoldPrice = tomanPrice;
      // Pre-fill calculator
      const gp = document.getElementById('gold-price');
      if (gp && !gp.value) gp.value = tomanPrice;
    }
  } else {
    document.getElementById('price-value').textContent = 'خطا در دریافت';
    document.getElementById('price-change').textContent = 'لطفاً بعداً تلاش کنید';
  }
}

// ========== Modals ==========
function openModal(id) {
  document.getElementById('modal-' + id).classList.add('active');
  if (id === 'calc-gold' && lastGoldPrice) {
    document.getElementById('gold-price').value = lastGoldPrice;
  }
}

function closeModal(id) {
  document.getElementById('modal-' + id).classList.remove('active');
}

// Close on outside click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// ========== Calculators ==========
function calcGold() {
  const weight = parseFloat(document.getElementById('gold-weight').value) || 0;
  const karat = parseFloat(document.getElementById('gold-karat').value) || 0.75;
  const price18 = parseFloat(document.getElementById('gold-price').value) || 0;

  if (!weight || !price18) {
    document.getElementById('gold-result').textContent = 'مقادیر را وارد کنید';
    return;
  }

  // Value = weight * (karat / 0.75) * price18
  const value = weight * (karat / 0.75) * price18;
  document.getElementById('gold-result').textContent =
    value.toLocaleString('fa-IR') + ' تومان';
}

function calcKarat() {
  const weight = parseFloat(document.getElementById('karat-weight').value) || 0;
  const from = parseFloat(document.getElementById('karat-from').value) || 0.75;
  const to = parseFloat(document.getElementById('karat-to').value) || 0.999;

  if (!weight) {
    document.getElementById('karat-result').textContent = 'وزن را وارد کنید';
    return;
  }

  const pure = weight * from;
  const result = pure / to;
  document.getElementById('karat-result').textContent =
    result.toFixed(3).toLocaleString('fa-IR') + ' گرم';
}

function calcProfit() {
  const buy = parseFloat(document.getElementById('profit-buy').value) || 0;
  const sell = parseFloat(document.getElementById('profit-sell').value) || 0;
  const weight = parseFloat(document.getElementById('profit-weight').value) || 0;

  if (!buy || !sell || !weight) {
    document.getElementById('profit-result').textContent = 'مقادیر را وارد کنید';
    return;
  }

  const profit = (sell - buy) * weight;
  const pct = ((sell - buy) / buy * 100).toFixed(1);
  const sign = profit >= 0 ? '+' : '';
  const color = profit >= 0 ? 'var(--green)' : 'var(--red)';

  document.getElementById('profit-result').innerHTML =
    `<span style="color:${color}">${sign}${profit.toLocaleString('fa-IR')} تومان (${sign}${pct}٪)</span>`;
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      updateAsset(item.dataset.asset);
    });
  });

  document.querySelectorAll('.timeframe').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timeframe').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  updateAsset('silver');
  console.log('ZARSIL V14 ready');
});
