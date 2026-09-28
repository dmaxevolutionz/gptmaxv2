import json
import math
import yfinance as yf

# GPTmax V2 advance - Daftar Emiten IDX Pilihan Swing Trader (150+ Ticker)
RAW_TICKERS = [
    # Bluechip / Big Cap
    {"ticker": "BBCA", "category": "Bluechip"}, {"ticker": "BBRI", "category": "Bluechip"},
    {"ticker": "BMRI", "category": "Bluechip"}, {"ticker": "BBNI", "category": "Bluechip"},
    {"ticker": "TLKM", "category": "Bluechip"}, {"ticker": "ASII", "category": "Bluechip"},
    {"ticker": "UNVR", "category": "Bluechip"}, {"ticker": "ICBP", "category": "Bluechip"},
    {"ticker": "INDF", "category": "Bluechip"}, {"ticker": "AMRT", "category": "Bluechip"},
    {"ticker": "TPIA", "category": "Bluechip"}, {"ticker": "BREN", "category": "Bluechip"},
    {"ticker": "BYAN", "category": "Bluechip"}, {"ticker": "CPIN", "category": "Bluechip"},
    {"ticker": "GOTO", "category": "Bluechip"}, {"ticker": "KLBF", "category": "Bluechip"},

    # Energy, Mining & Metals
    {"ticker": "ADRO", "category": "Energy/Mining"}, {"ticker": "PTBA", "category": "Energy/Mining"},
    {"ticker": "ITMG", "category": "Energy/Mining"}, {"ticker": "MEDC", "category": "Energy/Mining"},
    {"ticker": "ANTM", "category": "Energy/Mining"}, {"ticker": "INCO", "category": "Energy/Mining"},
    {"ticker": "PGAS", "category": "Energy/Mining"}, {"ticker": "AKRA", "category": "Energy/Mining"},
    {"ticker": "HRUM", "category": "Energy/Mining"}, {"ticker": "MBMA", "category": "Energy/Mining"},
    {"ticker": "NCKL", "category": "Energy/Mining"}, {"ticker": "AMMN", "category": "Energy/Mining"},
    {"ticker": "CUAN", "category": "Energy/Mining"}, {"ticker": "DOID", "category": "Energy/Mining"},
    {"ticker": "INDY", "category": "Energy/Mining"}, {"ticker": "ELSA", "category": "Energy/Mining"},
    {"ticker": "ENRG", "category": "Energy/Mining"}, {"ticker": "BUMI", "category": "Energy/Mining"},
    {"ticker": "DEWA", "category": "Energy/Mining"}, {"ticker": "BRMS", "category": "Energy/Mining"},
    {"ticker": "HUMI", "category": "Energy/Mining"}, {"ticker": "BNBR", "category": "Energy/Mining"},
    {"ticker": "TINS", "category": "Energy/Mining"}, {"ticker": "PSAB", "category": "Energy/Mining"},

    # Banking & Financials
    {"ticker": "BRIS", "category": "Financials"}, {"ticker": "BBTN", "category": "Financials"},
    {"ticker": "BDMN", "category": "Financials"}, {"ticker": "BNGA", "category": "Financials"},
    {"ticker": "NISP", "category": "Financials"}, {"ticker": "PNBN", "category": "Financials"},
    {"ticker": "ARTO", "category": "Financials"}, {"ticker": "BBYB", "category": "Financials"},
    {"ticker": "BANK", "category": "Financials"}, {"ticker": "AGRO", "category": "Financials"},
    {"ticker": "BSIM", "category": "Financials"}, {"ticker": "MAYA", "category": "Financials"},

    # Telecom, Tech & Infrastructure
    {"ticker": "EXCL", "category": "Tech/Infra"}, {"ticker": "ISAT", "category": "Tech/Infra"},
    {"ticker": "TOWR", "category": "Tech/Infra"}, {"ticker": "TBIG", "category": "Tech/Infra"},
    {"ticker": "MTEL", "category": "Tech/Infra"}, {"ticker": "EMTK", "category": "Tech/Infra"},
    {"ticker": "SCMA", "category": "Tech/Infra"}, {"ticker": "BUKA", "category": "Tech/Infra"},
    {"ticker": "WIFI", "category": "Tech/Infra"}, {"ticker": "CENT", "category": "Tech/Infra"},
    {"ticker": "MLPT", "category": "Tech/Infra"}, {"ticker": "MTDL", "category": "Tech/Infra"},

    # Consumer & Healthcare
    {"ticker": "MYOR", "category": "Consumer/Health"}, {"ticker": "CMRY", "category": "Consumer/Health"},
    {"ticker": "ACES", "category": "Consumer/Health"}, {"ticker": "MAPI", "category": "Consumer/Health"},
    {"ticker": "MAPA", "category": "Consumer/Health"}, {"ticker": "RALS", "category": "Consumer/Health"},
    {"ticker": "LPPF", "category": "Consumer/Health"}, {"ticker": "ERAA", "category": "Consumer/Health"},
    {"ticker": "MIKA", "category": "Consumer/Health"}, {"ticker": "HEAL", "category": "Consumer/Health"},
    {"ticker": "SILO", "category": "Consumer/Health"}, {"ticker": "SIDO", "category": "Consumer/Health"},
    {"ticker": "TSPC", "category": "Consumer/Health"}, {"ticker": "KAEF", "category": "Consumer/Health"},
    {"ticker": "CLEO", "category": "Consumer/Health"}, {"ticker": "ULTJ", "category": "Consumer/Health"},

    # Property & Construction
    {"ticker": "BSDE", "category": "Property"}, {"ticker": "CTRA", "category": "Property"},
    {"ticker": "PWON", "category": "Property"}, {"ticker": "SMRA", "category": "Property"},
    {"ticker": "ASRI", "category": "Property"}, {"ticker": "ADHI", "category": "Property"},
    {"ticker": "PTPP", "category": "Property"}, {"ticker": "WIKA", "category": "Property"},
    {"ticker": "TOTL", "category": "Property"}, {"ticker": "DILD", "category": "Property"},

    # Industrial & Agro
    {"ticker": "SMGR", "category": "Industrial/Agro"}, {"ticker": "INTP", "category": "Industrial/Agro"},
    {"ticker": "UNTR", "category": "Industrial/Agro"}, {"ticker": "AUTO", "category": "Industrial/Agro"},
    {"ticker": "GJTL", "category": "Industrial/Agro"}, {"ticker": "SMSM", "category": "Industrial/Agro"},
    {"ticker": "MAIN", "category": "Industrial/Agro"}, {"ticker": "JPFA", "category": "Industrial/Agro"},
    {"ticker": "TAPG", "category": "Industrial/Agro"}, {"ticker": "DSNG", "category": "Industrial/Agro"},
    {"ticker": "SSMS", "category": "Industrial/Agro"}, {"ticker": "LSIP", "category": "Industrial/Agro"},
    {"ticker": "AALI", "category": "Industrial/Agro"}, {"ticker": "ASSA", "category": "Industrial/Agro"}
]

def sanitize_value(val):
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return 0.0
        return round(val, 2)
    elif isinstance(val, dict):
        return {k: sanitize_value(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [sanitize_value(v) for v in val]
    return val

def generate_emiten_data():
    print("🚀 GPTmax V2 advance: Memulai penarikan data...")
    dataset = []

    for item in RAW_TICKERS:
        symbol = item["ticker"]
        category = item["category"]
        yf_symbol = f"{symbol}.JK"

        try:
            ticker = yf.Ticker(yf_symbol)
            df = ticker.history(period="60d")

            if df.empty or len(df) < 5:
                print(f"⚠️ Data {symbol} tidak cukup, dilewati.")
                continue

            history = []
            for date, row in df.iterrows():
                history.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": sanitize_value(float(row["Open"])),
                    "high": sanitize_value(float(row["High"])),
                    "low": sanitize_value(float(row["Low"])),
                    "close": sanitize_value(float(row["Close"])),
                    "volume": int(row["Volume"]) if not math.isnan(row["Volume"]) else 0
                })

            latest_close = history[-1]["close"]
            prev_close = history[-2]["close"] if len(history) > 1 else latest_close
            change_pct = sanitize_value(((latest_close - prev_close) / prev_close) * 100) if prev_close > 0 else 0.0

            dataset.append({
                "ticker": symbol,
                "category": category,
                "price": latest_close,
                "change": change_pct,
                "history": history
            })
            print(f"✅ {symbol} ({category}) diproses.")

        except Exception as e:
            print(f"❌ Error pada {symbol}: {e}")

    clean_dataset = sanitize_value(dataset)
    js_content = f"// Generated by GPTmax V2 advance\nconst EMITEN_DATA = {json.dumps(clean_dataset, indent=2)};"
    
    with open("emiten.js", "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"\n🎉 Selesai! Total {len(clean_dataset)} emiten disimpan ke 'emiten.js'.")

if __name__ == "__main__":
    generate_emiten_data()