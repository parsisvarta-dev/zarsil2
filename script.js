// ZARSIL V13 - Live prices from api.priceto.day

const API_BASE = 'https://api.priceto.day/v1/latest/irr';

// Convert Rial → Toman and format with Persian digits + thousand separators
function toToman(rial) {
  if (!rial && rial !== 0) return '—';
  const toman = Math.round(Number(rial) / 10);
  return toman.toLocaleString('fa-IR');
}

function formatChange(current, high, low) {
  // Simple daily change approximation
  if (!current || !low) return '';
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

// Cache for fetched data
const priceCache = {};

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
    console.warn('API error for', symbol, e);
  }
  return null;
}

async function updateAsset(key) {
  const asset = ASSETS[key];
  if (!asset) return;

  // Update static labels immediately
  document.getElementById('asset-name').textContent = asset.name;
  document.getElementById('asset-unit').textContent = asset.unit;
  document.getElementById('asset-emoji').textContent = asset.emoji;
  document.getElementById('chart-title').textContent = asset.chartTitle;
  document.getElementById('trend-title').textContent = asset.trendTitle;
  document.getElementById('global-title').textContent = asset.globalTitle;

  // Show loading state
  document.getElementById('price-value').textContent = '...';
  document.getElementById('price-change').textContent = 'در حال دریافت...';

  const data = await fetchPrice(asset.symbol);

  if (data) {
    document.getElementById('price-value').textContent = toToman(data.price);

    const change = formatChange(data.price, data.high, data.low);
    const changeEl = document.getElementById('price-change');
    changeEl.textContent = change.text + '  امروز';
    changeEl.className = 'price-change' + change.className;

    document.getElementById('meta-yesterday').textContent = toToman(data.low); // approx
    document.getElementById('meta-high').textContent = toToman(data.high);
    document.getElementById('meta-low').textContent = toToman(data.low);
    document.getElementById('meta-monthly').textContent = '—';

    // For global section (simple)
    if (key === 'dollar') {
      document.getElementById('global-price').textContent = toToman(data.price);
      document.getElementById('global-change').textContent = change.text;
    } else {
      // Keep previous global or show placeholder
      document.getElementById('global-price').textContent = toToman(data.price);
      document.getElementById('global-change').textContent = change.text;
    }
  } else {
    document.getElementById('price-value').textContent = 'خطا در دریافت';
    document.getElementById('price-change').textContent = 'لطفاً بعداً تلاش کنید';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar switching
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      updateAsset(item.dataset.asset);
    });
  });

  // Timeframe buttons
  document.querySelectorAll('.timeframe').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timeframe').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Load default (silver) on start
  updateAsset('silver');

  console.log('ZARSIL V13 – Live API connected');
});
