import { Component, NgZone, OnInit } from '@angular/core';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  socket = io('http://localhost:3000');
  tradeSignals: any[] = [];
  messages: string[] = [];
  selectedInterval: number = 60000;
  searchStock: string = '';
  selectedStocks: string[] = [];
  availableStocks: string[] = [];
  stockNameMap: { [key: number]: string } = {};
  stockTokenMap: { [key: string]: number } = {
    RELIANCE: 738561,
    TCS: 2953217,
    INFY: 408065,
    HDFCBANK: 341249,
    SBIN: 779521,
  };
  signalHistory: any = {};
  signalHistoryEntries: any[] = [];

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.socket.on('connect', () => this.addMessage('✅ Connected to backend'));
    this.socket.on('serverMessage', (msg) => this.addMessage(`ℹ️ ${msg}`));

    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          console.log('🔔 Notification permission granted');
        } else {
          console.warn('❌ Notification permission denied');
        }
      });
    }

    this.socket.on('tradeSignal', (signal) => {
      this.ngZone.run(() => {
        if (Notification.permission === 'granted') {
          new Notification(`🚨 ${signal.stockName} - ${signal.pattern}`, {
            body: `Direction: ${signal.direction}\nEntry: ₹${signal.entry} | SL: ₹${signal.stopLoss}`,
            icon: 'assets/icons/trade.png', // optional icon, else it’ll use browser/app default
          });
        }

        signal.stockName =
          this.stockNameMap[signal.stock] || `Token ${signal.stock}`;
        signal.dateTime = new Date().toLocaleString();

        // 🔥 Enhanced fields for depth and volume filtering
        signal.totalBuy = signal.liveTickData?.total_buy_quantity || 0;
        signal.totalSell = signal.liveTickData?.total_sell_quantity || 0;
        signal.bestBid = signal.liveTickData?.depth?.buy?.[0]?.price || null;
        signal.bestAsk = signal.liveTickData?.depth?.sell?.[0]?.price || null;
        signal.depthCheckPassed =
          (!signal.bestBid ||
            signal.direction !== 'Long' ||
            signal.bestBid >= signal.entry) &&
          (!signal.bestAsk ||
            signal.direction !== 'Short' ||
            signal.bestAsk <= signal.entry) &&
          ((signal.direction === 'Long' &&
            signal.totalBuy > signal.totalSell) ||
            (signal.direction === 'Short' &&
              signal.totalSell > signal.totalBuy));

        // Existing optional fields
        signal.liveVWAP = signal.liveTickData?.liveVWAP || null;
        signal.liveRSI = signal.liveTickData?.liveRSI || null;
        signal.priceDeviation = signal.liveTickData?.priceDeviation || null;

        if (signal.spread <= 0.5 && signal.liquidity >= 1000) {
          signal.confidence = 'High';
        } else if (signal.spread <= 1 && signal.liquidity >= 500) {
          signal.confidence = 'Medium';
        } else {
          signal.confidence = 'Low';
        }

        const recentHistory = this.signalHistory[signal.stock] || [];
        const now = Date.now();
        const windowMs = 3 * 60 * 1000;
        const conflicting = recentHistory.find(
          (s: any) =>
            now - s.timestamp < windowMs && s.direction !== signal.direction
        );
        signal.conflict = conflicting ? true : false;

        this.signalHistory[signal.stock] = recentHistory.filter(
          (s: any) => now - s.timestamp < windowMs
        );
        this.signalHistory[signal.stock].push({
          stock: signal.stockName,
          pattern: signal.pattern,
          direction: signal.direction,
          timestamp: now,
        });

        // ✅ AI-enhanced summary fields
        signal.ai = signal.ai || {};
        signal.ai.explanation = signal.ai.explanation || 'N/A';
        signal.ai.plan =
          signal.ai.plan ||
          `Buy at ₹${signal.entry}, SL ₹${signal.stopLoss}, TGT ₹${signal.target1}`;
        signal.ai.confidenceReview =
          signal.ai.confidenceReview || `Confidence: ${signal.confidence}`;
        signal.ai.advisory =
          signal.ai.advisory || 'Use proper risk management.';

        this.tradeSignals.unshift(signal);
        console.log('Received signal:', signal);
        this.addMessage(
          `🚀 Signal for ${signal.stockName} (${signal.pattern})`
        );
        this.updateSignalHistoryEntries();
      });
    });

    this.socket.on('disconnect', () =>
      this.addMessage('❌ Disconnected from backend')
    );
    this.socket.on('connect_error', (err) =>
      this.addMessage(`❌ Connection error: ${err.message}`)
    );
    this.loadSignalHistory();
  }

  loadSignalHistory() {
    fetch('http://localhost:3000/signal-history')
      .then((res) => res.json())
      .then((data) => {
        this.signalHistory = data;
        this.updateSignalHistoryEntries();
      });
  }

  updateSignalHistoryEntries() {
    this.signalHistoryEntries = Object.values(this.signalHistory).flat();
  }

  addMessage(msg: string) {
    console.log(msg);
    this.messages.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  }

  setInterval() {
    fetch('http://localhost:3000/set-interval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: this.selectedInterval }),
    })
      .then((res) => res.json())
      .then((data) => this.addMessage(`⏲ Interval set to ${data.interval} ms`))
      .catch((err) =>
        this.addMessage(`❌ Interval change failed: ${err.message}`)
      );
  }

  fetchAvailableStocks() {
    fetch('http://localhost:3000/instruments')
      .then((res) => res.json())
      .then((data) => {
        this.ngZone.run(() => {
          this.availableStocks = data.map(
            (s: { name: any; token: any }) => `${s.name} (${s.token})`
          );
          this.stockTokenMap = Object.fromEntries(
            data.map((s: { name: any; token: any }) => [
              `${s.name} (${s.token})`,
              s.token,
            ])
          );
          this.stockNameMap = Object.fromEntries(
            data.map((s: { name: any; token: any }) => [s.token, s.name])
          );
          this.addMessage(`📈 Loaded ${data.length} stocks from backend`);
        });
      })
      .catch((err) =>
        this.addMessage(`❌ Failed to load stocks: ${err.message}`)
      );
  }

  subscribeStocks() {
    const tokens = this.selectedStocks
      .map((stockStr) => this.stockTokenMap[stockStr])
      .filter((token) => token !== undefined);
    fetch('http://localhost:3000/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens }),
    })
      .then((res) => res.json())
      .then(() =>
        this.addMessage(
          `🔄 Subscribed to stocks: ${this.selectedStocks.join(', ')}`
        )
      )
      .catch((err) =>
        this.addMessage(`❌ Subscription failed: ${err.message}`)
      );
  }

  getSignalAge(dateTime: string): string {
    const now = new Date();
    const signalTime = new Date(dateTime);
    const diffSec = Math.floor((now.getTime() - signalTime.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const mins = Math.floor(diffSec / 60);
    return `${mins} min ago`;
  }
}
