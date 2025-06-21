# 📈 Intraday Swing Trading Dashboard

A **real-time swing trading application** built with:

- 🖥️ **Angular Frontend**
- 🔥 **Node.js + Express Backend**
- ⚡ **Zerodha Kite Connect APIs** (for live tick data, order placement)

The system:

- **Detects candlestick patterns** from live market data.
- **Generates trade signals** based on **patterns, trends, and technical indicators**.
- **Displays signals and charts** in the frontend.
- Allows **direct trade execution** using **Zerodha APIs**.
- Supports **intraday swing trading** only.

---

## 🏗️ Project Structure

```
scanner-app/
├── backend/                  # Node.js backend with Express + Kite Connect
│   ├── kite.js               # Handles Zerodha sessions, ticks, candles
│   ├── scanner.js            # Pattern detection & signal generation
│   ├── util.js               # Technical indicator calculations
│   ├── routes/               # Contains instruments.json (symbols ↔ tokens)
│   ├── historical_data.json  # Daily data cache for MA/ATR
│   ├── session_data.json     # Intraday data cache (3-min candles)
│   └── index.js              # Backend server (Express + WebSocket)
├── frontend/                 # Angular frontend
│   ├── app.component.ts      # Connects WebSocket, displays signals
│   ├── app.component.html    # Displays tables, filters, charts
│   └── services/             # Signal service (optional)
└── README.md                 # This file
```

---

## 🚀 Features

### ✅ **Backend**

- Connects to **Zerodha Kite** for **live tick data** (via WebSocket) and **historical candles**.
- Aggregates **intraday candles (1-min/3-min)** for pattern detection.
- Detects:

  - Breakout
  - Engulfing Bullish/Bearish
  - Inside Bar
  - Bull Flag
  - Ascending Triangle
  - Cup and Handle
  - Double Top/Bottom
  - Falling Wedge
  - Pennant
  - VWAP Reversal

- Calculates:

  - Moving Averages (MA20, MA50)
  - Exponential MA (EMA50)
  - Average True Range (ATR)
  - Supertrend Signal
  - Volume-weighted confirmations

- **Signal Prioritization & Conflict Detection**:

  - Filters signals based on **pattern strength** (Breakout > Engulfing > others).
  - Confirms signals with **MA trends, RSI, Supertrend**.
  - Avoids **conflicting signals** (same stock, different directions).

### ✅ **Frontend**

- Built in **Angular**; connects to backend via **WebSocket**.
- Displays:

  - **All trade signals** (real-time)
  - **Filtered signals (1:2 and 1:3 Risk-Reward)**
  - **Stock token mapping to names**
  - **Trend indicators (RSI, MA, ATR, Supertrend)**

- Supports:

  - **Search & filter** by stock or pattern.
  - **Multi-select stocks** to subscribe.
  - **Real-time updates** with easy UI.

- **Planned**: Candlestick charts (e.g., Chart.js or TradingView), trade buttons.

### ✅ **Zerodha Integration**

- Uses **Kite Connect** for:

  - Live tick data (via KiteTicker).
  - Fetching historical and session candles.
  - Calculating live indicators (MA, ATR, Supertrend).

- (Planned) **Order Placement**:

  - Place buy/sell orders directly from the UI.
  - Support for **SL, Target, Entry** prices.

---

## 🔐 Authentication & Security

- **Zerodha session** managed via tokens (`tokens.json`).
- CORS setup for `http://localhost:4200` (frontend) and backend (`http://localhost:3000`).
- Rate limiting and authentication **recommended** for production.

---

## 🛠️ Setup Instructions

### 1️⃣ Prerequisites

- **Node.js (>=14)**
- **Angular CLI**
- **Zerodha Kite Connect credentials** (API Key, Secret, Request Token)

### 2️⃣ Backend Setup

```bash
cd scanner-app/backend
npm install
```

- Create a `.env` file:

```
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
KITE_REQUEST_TOKEN=your_request_token
```

- Prepare `routes/instruments.json` (fetch from Zerodha or use provided).

- Start backend:

```bash
node index.js
```

### 3️⃣ Frontend Setup

```bash
cd scanner-app/frontend
npm install
ng serve --port 4200
```

### 4️⃣ Connect Backend & Frontend

- Backend runs on `http://localhost:3000`.
- Frontend runs on `http://localhost:4200`.
- CORS is configured to allow this.

---

## ⚙️ Live Trading Flow

1️⃣ **Start Backend**: Connects to Zerodha, fetches live ticks & session data.
2️⃣ **Start Frontend**: Displays real-time signals from backend via WebSocket.
3️⃣ **Pattern Detection**: Backend analyzes combined tick/session/historical data, emits high-confidence signals.
4️⃣ **User Action**: User reviews signals, confirms with chart, places order.
5️⃣ **(Planned)**: Order API integrates directly with Zerodha to execute trades.

---

## 📊 Technical Logic Summary

- **Moving Averages (MA20, MA50)**: Calculated from historical and intraday data.
- **ATR**: Intraday or fallback to daily data for volatility-adjusted stop-loss and targets.
- **Supertrend**: Determines general trend (Buy/Sell) from recent candles.
- **Pattern Priority**: Breakout > Engulfing > Inside Bar > Others.
- **Signal Confidence**: Based on MA alignment, Supertrend confirmation, RSI, liquidity, spread.
- **Conflict Detection**: Avoids conflicting signals within short time windows.

---

## 🔥 Future Improvements

- ✅ Direct Zerodha order placement (with SL, target, qty).
- ✅ Charts (candlestick + overlays) on the frontend.
- ✅ Signal dashboard sorting by priority & strength.
- ✅ Notifications for new signals.
- ✅ Full user authentication.

---

## 🏆 Contributors

- **Developer**: Hemanth (with GPT-4 assist 😉)
- **Broker API**: Zerodha Kite Connect

---

┌──────────────────────────┐
│ User/Market Data │
└─────────────┬────────────┘
│
▼
┌────────────────────┐
│ KiteTicker (Live) │
└────────────────────┘
│
▼
┌───────────────────────────┐
│ Aggregate Ticks into 1/3m │
│ Live Candle Buffer │
└───────────────────────────┘
│
▼
┌───────────────────────────┐
│ Calculate EMA(9,21) + ATR │
│ from Rolling Buffer │
└───────────────────────────┘
│
▼
┌───────────────────────────────┐
│ Run analyzeCandles (scanner) │
│ - Pattern Detection │
│ - EMA9/21 Trend Filtering │
│ - Smart Filter (Spread,Vol) │
│ - Conflict Detection │
└───────────────────────────────┘
│
▼
┌────────────────────────────┐
│ Emit Trade Signal via WS │
│ - Entry, Stop, Targets │
│ - Pattern, Confidence │
└────────────────────────────┘
│
▼
┌────────────────────┐
│ Frontend/Clients │
└────────────────────┘

expected output
{
"stock": "NSE:TCS",
"pattern": "Breakout",
"direction": "Long",
"entry": 3200.5,
"stopLoss": 3180.0,
"target1": 3241.0,
"target2": 3281.5,
"ema9": 3198.3,
"ema21": 3190.7,
"atr": 12.5,
"supertrend": { "signal": "Buy", "level": 3185.0 },
"confidence": "High",
"rsi": 65.4,
"spread": 0.3,
"liquidity": 12000,
"slippage": 3.2
}

---

flowchart TD
A[Start: Market Opens] --> B[Stock Scanner Dashboard Runs]
B --> C[Fetch Real-Time Data & Historical Data]
C --> D[Apply Technical Analysis]
D --> E[Identify Trade Signals]
E --> F{Does it meet 1:2 or 1:3 R:R?}
F -- Yes --> G[Display/Emit Trade Signal]
G --> H[Review Signal Details: Entry, SL, Target, Confidence]
H --> I{Trade Decision}
I -- Place Trade --> J[Set Order with Zerodha/Manual]
I -- Skip Trade --> K[Wait for Next Signal]
J --> L[Monitor Trade: Price Movements]
L --> M{Target Hit or SL Hit}
M -- Target Hit --> N[Book Profits]
M -- SL Hit --> O[Exit Trade: Minimize Loss]
N & O --> P[Log Trade in Performance Tracker]
P --> Q[Review and Adjust Strategy]
Q --> B

    F -- No --> R[Ignore & Scan for Next Signal]
    R --> B

```
<!-- node kite.js --fetch-historical -->

ENCHANCMENTS
-> Dynamic Re-Evaluation of Active Positions
-> Introduce Trailing Stop-Loss/Profit-Locking
-> Advanced Feature: Adaptive Signal Update
->Add signal conflict detection logic
i was planning to have a buy button next to each signal. when user click on buy button then we can trade that trade on token. we can implement the buy functionality later. write the complete code for the Dynamic Re-Evaluation of Active Positions
```

High Liquidity Periods
First and last trading hours (e.g., 9:15–10:30 AM & 2:30–3:30 PM IST).
