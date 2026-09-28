/**
 * component.js - Engine Indikator Teknikal & Exporter Gambar PNG
 * GPTmax V2 advance
 */
const SwingIndicators = {

  calculateBandarmology: function(history) {
    if (!history || history.length < 5) {
      return { status: "NEUTRAL", buyRatio: 50, label: "Data Kurang", icon: "⚪" };
    }

    const recent = history.slice(-10);
    let buyVol = 0;
    let sellVol = 0;

    recent.forEach(c => {
      if (c.close >= c.open) buyVol += c.volume;
      else sellVol += c.volume;
    });

    const total = buyVol + sellVol;
    const buyRatio = total > 0 ? Math.round((buyVol / total) * 100) : 50;

    if (buyRatio >= 65) return { status: "BIG_ACCUM", buyRatio, label: `Big Accumulation (${buyRatio}% Buy)`, icon: "🐋🟩" };
    if (buyRatio >= 55) return { status: "ACCUM", buyRatio, label: `Akumulasi (${buyRatio}% Buy)`, icon: "📈🟢" };
    if (buyRatio <= 35) return { status: "BIG_DIST", buyRatio, label: `Big Distribution (${100 - buyRatio}% Sell)`, icon: "🚨🔴" };
    if (buyRatio <= 45) return { status: "DIST", buyRatio, label: `Distribusi (${100 - buyRatio}% Sell)`, icon: "📉🔴" };

    return { status: "NEUTRAL", buyRatio, label: `Netral (${buyRatio}% Buy)`, icon: "⚪" };
  },

  calculateVolumeMetrics: function(history) {
    if (!history || history.length < 10) {
      return { rvol: 1.0, isSpike: false, obvStatus: "NETRAL", obvIcon: "⚪" };
    }

    const currVol = history[history.length - 1].volume;
    const prevVols = history.slice(-11, -1).map(c => c.volume);
    const avgVol = (prevVols.reduce((a, b) => a + b, 0) / prevVols.length) || 1;

    const rvol = parseFloat((currVol / avgVol).toFixed(1));
    const isSpike = rvol >= 1.5;

    let obv = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].close > history[i - 1].close) obv += history[i].volume;
      else if (history[i].close < history[i - 1].close) obv -= history[i].volume;
    }

    return {
      rvol: isNaN(rvol) ? 1.0 : rvol,
      isSpike,
      obvStatus: obv >= 0 ? "AKUMULASI" : "DISTRIBUSI",
      obvIcon: obv >= 0 ? "🟢" : "🔴"
    };
  },

  calculatePowerScore: function(history, price) {
    if (!history || history.length < 14) return { score: 50, label: "NEUTRAL", maTrend: "Sampingan" };

    const closes = history.map(c => c.close);
    const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(closes.length, 20);
    const isUptrend = price >= ma20;

    const bandar = this.calculateBandarmology(history);
    const vol = this.calculateVolumeMetrics(history);

    let score = 50;
    if (isUptrend) score += 15;
    if (bandar.status === "BIG_ACCUM") score += 20;
    if (bandar.status === "ACCUM") score += 10;
    if (vol.isSpike) score += 15;

    score = Math.min(100, Math.max(0, score));

    return {
      score,
      label: score >= 75 ? "STRONG BULLISH" : score >= 55 ? "BULLISH" : "NEUTRAL / BEARISH",
      maTrend: isUptrend ? "Uptrend (Harga > EMA20)" : "Downtrend (Harga < EMA20)"
    };
  },

  detectCandlePattern: function(history) {
    if (!history || history.length < 2) return { name: "Normal Candle" };

    const curr = history[history.length - 1];
    const prev = history[history.length - 2];

    if (curr.close > curr.open && prev.close < prev.open && curr.close > prev.open && curr.open < prev.close) {
      return { name: "Bullish Engulfing 🕯️" };
    }

    const body = Math.abs(curr.close - curr.open);
    const lowerWick = Math.min(curr.open, curr.close) - curr.low;

    if (lowerWick > body * 2 && body > 0) {
      return { name: "Hammer / Pinbar 🔨" };
    }

    return { name: curr.close >= curr.open ? "Bullish Candle 📈" : "Bearish Candle 📉" };
  },

  calculateStochastic: function(history) {
    if (!history || history.length < 14) return { status: "NEUTRAL (50)" };

    const slice = history.slice(-14);
    const currClose = history[history.length - 1].close;
    const lowest = Math.min(...slice.map(c => c.low));
    const highest = Math.max(...slice.map(c => c.high));

    const k = highest !== lowest ? Math.round(((currClose - lowest) / (highest - lowest)) * 100) : 50;

    if (k <= 20) return { status: `Golden Cross Oversold (${k})` };
    if (k >= 80) return { status: `Overbought Zone (${k})` };
    return { status: `Netral Zone (${k})` };
  },

  calculateTradingPlan: function(price) {
    const buyLow = Math.round(price * 0.985);
    const sl = Math.round(price * 0.96);
    const tp1 = Math.round(price * 1.05);
    const tp2 = Math.round(price * 1.10);

    return {
      buyZone: `${buyLow.toLocaleString('id-ID')} - ${price.toLocaleString('id-ID')}`,
      stopLoss: `${sl.toLocaleString('id-ID')} (-4%)`,
      tp1: `${tp1.toLocaleString('id-ID')} (+5%)`,
      tp2: `${tp2.toLocaleString('id-ID')} (+10%)`,
      rrRatio: "1 : 2.2"
    };
  }
};