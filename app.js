/**
 * app.js - GPTmax V2 advance
 * Signal Bar, Persentase Badge, Admin Manager & Generator Executor
 */
let allStocks = [];
let activeFilter = 'ALL';
let activeStockForModal = null;

function initApp() {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => splash.remove(), 500);
    }
  }, 1800);

  const gridEl = document.getElementById('screener-grid');
  if (!gridEl) return;

  const storedData = localStorage.getItem('CUSTOM_EMITEN_DATA');
  if (storedData) {
    try {
      allStocks = JSON.parse(storedData);
    } catch (e) {
      allStocks = typeof EMITEN_DATA !== 'undefined' ? EMITEN_DATA : [];
    }
  } else {
    allStocks = typeof EMITEN_DATA !== 'undefined' ? EMITEN_DATA : [];
  }

  if (allStocks.length > 0) {
    applyFilterAndRender();
  } else {
    gridEl.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-400 bg-slate-900 border border-red-500/20 rounded-xl p-4 text-xs">
        <p class="font-bold text-sm mb-1">⚠️ Variabel EMITEN_DATA Tidak Ditemukan</p>
        <p class="text-slate-400">Jalankan <b>python generator.py</b> atau jalankan server dengan <b>node server.js</b>.</p>
      </div>
    `;
  }

  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput && clearBtn) {
    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim() !== '') {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
      applyFilterAndRender();
    });
  }
}

function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  if (searchInput) {
    searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    applyFilterAndRender();
  }
}

function setFilter(category) {
  activeFilter = category;
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-amber-500', 'text-slate-950', 'border-amber-400');
    btn.classList.add('bg-slate-900', 'text-slate-400', 'border-slate-800');
  });

  const activeBtn = document.getElementById(`tab-${category}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-slate-900', 'text-slate-400', 'border-slate-800');
    activeBtn.classList.add('bg-amber-500', 'text-slate-950', 'border-amber-400');
  }

  applyFilterAndRender();
}

function applyFilterAndRender() {
  const query = document.getElementById('search-input')?.value.toUpperCase().trim() || '';

  const filtered = allStocks.filter(stock => {
    const history = stock.history || [];
    const bandar = SwingIndicators.calculateBandarmology(history);
    const vol = SwingIndicators.calculateVolumeMetrics(history);
    const power = SwingIndicators.calculatePowerScore(history, stock.price);

    const matchSearch = stock.ticker.includes(query) || (stock.category && stock.category.toUpperCase().includes(query));
    if (!matchSearch) return false;

    if (activeFilter === 'BIG_ACCUM') return bandar.status === 'BIG_ACCUM';
    if (activeFilter === 'BULLISH_POWER') return power.score >= 75;
    if (activeFilter === 'VOLUME_SPIKE') return vol.isSpike;
    if (activeFilter === 'BUY_ZONE') return stock.change <= 1.0 && stock.change >= -3.0;

    return true;
  });

  renderGrid(filtered);
}

function renderGrid(stocks) {
  const gridEl = document.getElementById('screener-grid');
  gridEl.innerHTML = '';

  if (stocks.length === 0) {
    gridEl.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 text-xs">Tidak ada emiten yang sesuai kriteria filter.</div>`;
    return;
  }

  stocks.forEach(stock => {
    const history = stock.history || [];
    const bandar = SwingIndicators.calculateBandarmology(history);
    const vol = SwingIndicators.calculateVolumeMetrics(history);
    const power = SwingIndicators.calculatePowerScore(history, stock.price);
    const isPositive = stock.change >= 0;

    // Warna Signal Bar berdasarkan Power Score
    let barColor = 'bg-red-500';
    if (power.score >= 75) barColor = 'bg-emerald-400';
    else if (power.score >= 50) barColor = 'bg-amber-400';

    const card = document.createElement('div');
    card.className = "bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between";
    card.onclick = () => openModalByTicker(stock.ticker);

    card.innerHTML = `
      <div>
        <!-- Ticker & Persentase Badge -->
        <div class="flex justify-between items-start mb-1">
          <div>
            <span class="font-black text-amber-400 text-sm tracking-wide block">${stock.ticker}</span>
            <span class="text-[9px] text-slate-500 font-semibold block">${stock.category || 'IDX'}</span>
          </div>
          <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
            ${isPositive ? '+' : ''}${stock.change}%
          </span>
        </div>

        <!-- Harga Emiten -->
        <div class="text-sm font-extrabold text-slate-100 mb-2">
          Rp ${stock.price.toLocaleString('id-ID')}
        </div>

        <!-- SIGNAL BAR (POWER SCORE BAR) -->
        <div class="mb-3 space-y-1">
          <div class="flex justify-between text-[9px] font-bold">
            <span class="text-slate-400">SIGNAL POWER</span>
            <span class="${power.score >= 75 ? 'text-emerald-400' : 'text-amber-400'}">${power.score}/100</span>
          </div>
          <div class="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div class="${barColor} h-full transition-all duration-500" style="width: ${power.score}%"></div>
          </div>
        </div>
      </div>

      <!-- Bandarmology & RVOL Footer -->
      <div class="border-t border-slate-800/80 pt-2 space-y-1 text-[10px]">
        <div class="flex justify-between text-slate-400">
          <span>Flow:</span>
          <span class="font-bold text-slate-200">${bandar.icon} ${bandar.buyRatio}%</span>
        </div>
        <div class="flex justify-between text-slate-400">
          <span>RVOL:</span>
          <span class="font-bold ${vol.isSpike ? 'text-amber-400 font-extrabold' : 'text-slate-300'}">${vol.rvol}x</span>
        </div>
      </div>
    `;

    gridEl.appendChild(card);
  });
}

function openModalByTicker(ticker) {
  const stock = allStocks.find(s => s.ticker === ticker);
  if (!stock) return;

  activeStockForModal = stock;
  const history = stock.history || [];
  const bandar = SwingIndicators.calculateBandarmology(history);
  const vol = SwingIndicators.calculateVolumeMetrics(history);
  const power = SwingIndicators.calculatePowerScore(history, stock.price);
  const pattern = SwingIndicators.detectCandlePattern(history);
  const stoch = SwingIndicators.calculateStochastic(history);
  const plan = SwingIndicators.calculateTradingPlan(stock.price);

  document.getElementById('modal-ticker').innerText = stock.ticker;
  document.getElementById('modal-price').innerText = `Rp ${stock.price.toLocaleString('id-ID')}`;
  
  const changeEl = document.getElementById('modal-change');
  changeEl.innerText = `${stock.change >= 0 ? '+' : ''}${stock.change}%`;
  changeEl.className = `text-xs font-bold px-2 py-0.5 rounded-md ${stock.change >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`;

  document.getElementById('modal-power-score').innerText = `${power.score}/100`;
  document.getElementById('modal-power-label').innerText = power.label;
  document.getElementById('modal-ma-trend').innerText = power.maTrend;

  document.getElementById('modal-bandar-icon').innerText = bandar.icon;
  document.getElementById('modal-bandar-label').innerText = bandar.label;
  document.getElementById('modal-obv-status').innerText = `${vol.obvIcon} ${vol.obvStatus}`;
  document.getElementById('modal-rvol-val').innerText = `${vol.rvol}x ${vol.isSpike ? '(Spike 🔥)' : ''}`;

  document.getElementById('modal-candle-pattern').innerText = pattern.name;
  document.getElementById('modal-stoch-status').innerText = stoch.status;

  document.getElementById('modal-buy-zone').innerText = plan.buyZone;
  document.getElementById('modal-stop-loss').innerText = plan.stopLoss;
  document.getElementById('modal-tp1').innerText = plan.tp1;
  document.getElementById('modal-tp2').innerText = plan.tp2;
  document.getElementById('modal-rr-ratio').innerText = plan.rrRatio;

  document.getElementById('analysis-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('analysis-modal').classList.add('hidden');
  activeStockForModal = null;
}

function shareWhatsAppCurrent() {
  if (!activeStockForModal) return;
  const s = activeStockForModal;
  const history = s.history || [];
  const power = SwingIndicators.calculatePowerScore(history, s.price);
  const plan = SwingIndicators.calculateTradingPlan(s.price);

  const text = `*⚡ GPTmax V2 advance - Signal Analysis*\n\n` +
    `*Ticker:* ${s.ticker} (${s.category})\n` +
    `*Harga:* Rp ${s.price.toLocaleString('id-ID')} (${s.change >= 0 ? '+' : ''}${s.change}%)\n` +
    `*Power Score:* ${power.score}/100 [${power.label}]\n\n` +
    `*📋 Trading Plan:*\n` +
    `• Buy Zone: ${plan.buyZone}\n` +
    `• Stop Loss: ${plan.stopLoss}\n` +
    `• Target 1: ${plan.tp1}\n` +
    `• Target 2: ${plan.tp2}\n` +
    `• R/R Ratio: ${plan.rrRatio}\n\n` +
    `_Dianalisa oleh GPTmax V2 advance_`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ADMIN MANAGEMENT (Password: 5758)
function openAdminModal() {
  document.getElementById('admin-login-step').classList.remove('hidden');
  document.getElementById('admin-panel-step').classList.add('hidden');
  document.getElementById('admin-pass-input').value = '';
  document.getElementById('admin-modal').classList.remove('hidden');
}

function verifyAdminPassword() {
  const pass = document.getElementById('admin-pass-input').value;
  if (pass === "5758") {
    document.getElementById('admin-login-step').classList.add('hidden');
    document.getElementById('admin-panel-step').classList.remove('hidden');
    renderAdminEmitenList();
  } else {
    alert("❌ Password Salah!");
  }
}

function closeAdminModal() {
  document.getElementById('admin-modal').classList.add('hidden');
}

function renderAdminEmitenList() {
  const listEl = document.getElementById('admin-emiten-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  allStocks.forEach((stock, index) => {
    const row = document.createElement('div');
    row.className = "flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs";
    row.innerHTML = `
      <div>
        <b class="text-amber-400">${stock.ticker}</b> 
        <span class="text-slate-500 text-[10px]">(${stock.category || 'IDX'})</span>
        <span class="text-slate-300 ml-2">Rp ${stock.price.toLocaleString('id-ID')}</span>
      </div>
      <div class="flex gap-2">
        <button onclick="editEmitenAdmin(${index})" class="text-amber-400 hover:underline text-[10px]">Edit</button>
        <button onclick="deleteEmitenAdmin(${index})" class="text-red-400 hover:underline text-[10px]">Hapus</button>
      </div>
    `;
    listEl.appendChild(row);
  });
}

function addEmitenAdmin() {
  const ticker = prompt("Masukkan Kode Ticker Baru (contoh: UNTR):");
  if (!ticker) return;
  const category = prompt("Masukkan Kategori (contoh: Bluechip / Energy):") || "IDX Liquid";
  const price = parseFloat(prompt("Masukkan Harga Saat Ini:") || "1000");

  allStocks.push({
    ticker: ticker.toUpperCase(),
    category: category,
    price: price,
    change: 0.0,
    history: [
      { date: new Date().toISOString().split('T')[0], open: price, high: price, low: price, close: price, volume: 100000 }
    ]
  });

  saveAdminState();
}

function editEmitenAdmin(index) {
  const s = allStocks[index];
  const newPrice = prompt(`Ubah Harga untuk ${s.ticker}:`, s.price);
  if (newPrice !== null) {
    s.price = parseFloat(newPrice);
    saveAdminState();
  }
}

function deleteEmitenAdmin(index) {
  if (confirm(`Yakin ingin menghapus ${allStocks[index].ticker}?`)) {
    allStocks.splice(index, 1);
    saveAdminState();
  }
}

function saveAdminState() {
  localStorage.setItem('CUSTOM_EMITEN_DATA', JSON.stringify(allStocks));
  renderAdminEmitenList();
  applyFilterAndRender();
  alert("Data Emiten Berhasil Diperbarui!");
}

function resetAdminState() {
  if (confirm("Kembalikan ke data awal generator.py?")) {
    localStorage.removeItem('CUSTOM_EMITEN_DATA');
    allStocks = typeof EMITEN_DATA !== 'undefined' ? EMITEN_DATA : [];
    renderAdminEmitenList();
    applyFilterAndRender();
  }
}

// EKSEKUSI MANUAL generator.py VIA BACKEND
async function runGeneratorManual() {
  const btn = document.getElementById('btn-run-generator');
  const statusEl = document.getElementById('admin-status-msg');

  if (!btn || !statusEl) return;

  btn.disabled = true;
  btn.classList.add('opacity-50', 'cursor-not-allowed');
  btn.innerText = "⏳ Memproses YFinance...";

  statusEl.classList.remove('hidden');
  statusEl.className = "p-2 rounded-lg bg-slate-950 border border-amber-500/30 text-[11px] text-amber-400 font-mono";
  statusEl.innerText = "Mengirim perintah ke server... Harap tunggu, sedang menarik data pasar terkini...";

  try {
    const response = await fetch('/api/run-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') {
      statusEl.className = "p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-300 font-mono";
      statusEl.innerText = `✅ ${data.message}\nMemuat ulang halaman...`;

      setTimeout(() => {
        location.reload();
      }, 1500);

    } else {
      throw new Error(data.error || data.message || "Gagal memproses di server");
    }
  } catch (err) {
    statusEl.className = "p-2 rounded-lg bg-red-950/80 border border-red-500/40 text-[11px] text-red-300 font-mono";
    statusEl.innerText = `❌ Error: ${err.message}\nPastikan Anda menjalankan aplikasi via perintah 'node server.js'.`;
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    btn.innerText = "⚡ Eksekusi generator.py";
  }
}

// EXPORT TOP 20 PNG
function exportTop20PNG() {
  const top20 = [...allStocks]
    .map(s => {
      const history = s.history || [];
      const power = SwingIndicators.calculatePowerScore(history, s.price);
      const plan = SwingIndicators.calculateTradingPlan(s.price);
      const bandar = SwingIndicators.calculateBandarmology(history);
      return { ...s, powerScore: power.score, plan, bandar };
    })
    .sort((a, b) => b.powerScore - a.powerScore)
    .slice(0, 20);

  if (top20.length === 0) {
    alert("Tidak ada data emiten untuk di-export.");
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1200;
  canvas.height = 1750;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const logo = new Image();
  logo.src = 'assets/icon-192.png';
  logo.onload = () => drawCanvasContent();
  logo.onerror = () => drawCanvasContent();

  function drawCanvasContent() {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, 140);

    try { ctx.drawImage(logo, 40, 25, 90, 90); } catch(e){}

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('GPTmax V2 advance', 150, 65);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText('TOP 20 EMITEN PALING LAYAK BELI (SWING SCREENER)', 150, 100);

    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Tanggal: ${today}`, 850, 80);

    ctx.fillStyle = '#334155';
    ctx.fillRect(40, 160, 1120, 45);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('#', 60, 188);
    ctx.fillText('TICKER', 110, 188);
    ctx.fillText('HARGA', 260, 188);
    ctx.fillText('POWER SCORE', 420, 188);
    ctx.fillText('BUY ZONE', 620, 188);
    ctx.fillText('STOP LOSS', 820, 188);
    ctx.fillText('TARGET 1', 1000, 188);

    let startY = 230;
    top20.forEach((item, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#1e293b' : '#0f172a';
      ctx.fillRect(40, startY - 25, 1120, 60);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`${idx + 1}`, 60, startY + 10);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(item.ticker, 110, startY + 10);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Rp ${item.price.toLocaleString('id-ID')}`, 260, startY + 10);

      ctx.fillStyle = item.powerScore >= 75 ? '#34d399' : '#f59e0b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`${item.powerScore}/100`, 420, startY + 10);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '16px sans-serif';
      ctx.fillText(item.plan.buyZone, 620, startY + 10);

      ctx.fillStyle = '#fca5a5';
      ctx.font = '16px sans-serif';
      ctx.fillText(item.plan.stopLoss, 820, startY + 10);

      ctx.fillStyle = '#fde047';
      ctx.font = '16px sans-serif';
      ctx.fillText(item.plan.tp1, 1000, startY + 10);

      startY += 65;
    });

    ctx.fillStyle = '#475569';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('Generated automatically by GPTmax V2 advance', 40, canvas.height - 30);

    const link = document.createElement('a');
    link.download = `GPTmax_V2_Top20_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
