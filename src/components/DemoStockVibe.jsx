import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown, DollarSign, Activity, Newspaper, AlertCircle } from 'lucide-react';

export default function DemoStockVibe({ onBack }) {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stock Database
  const stockDb = {
    AAPL: { name: 'Apple Inc.', basePrice: 175.50, volatility: 0.8 },
    TSLA: { name: 'Tesla Inc.', basePrice: 215.20, volatility: 2.5 },
    NVDA: { name: 'NVIDIA Corp.', basePrice: 875.10, volatility: 3.2 },
    GOOGL: { name: 'Alphabet Inc.', basePrice: 152.80, volatility: 0.6 }
  };

  const [currentPrice, setCurrentPrice] = useState(175.50);
  const [priceHistory, setPriceHistory] = useState([173.2, 174.1, 173.8, 174.5, 175.0, 174.8, 175.5]);
  const [priceChange, setPriceChange] = useState(0.45);
  const [isUp, setIsUp] = useState(true);

  // News & Sentiment mock databases
  const newsDb = {
    AAPL: [
      { headline: "Apple unveils next-generation M4 chips focusing on local AI models", sentiment: 0.65, polarity: "Bullish", source: "TechCrunch" },
      { headline: "EU regulators levy antitrust fine on iPhone App Store licensing fee policy", sentiment: -0.45, polarity: "Bearish", source: "Bloomberg" },
      { headline: "Supplier shipments indicate stable demand for upcoming product cycle", sentiment: 0.15, polarity: "Neutral", source: "Reuters" }
    ],
    TSLA: [
      { headline: "Tesla targets autonomous driving expansion in international markets", sentiment: 0.70, polarity: "Bullish", source: "CleanTechnica" },
      { headline: "Concerns arise over production bottlenecks at Berlin gigafactory", sentiment: -0.55, polarity: "Bearish", source: "WSJ" },
      { headline: "Price cuts in regional centers influence quarterly gross margins", sentiment: -0.20, polarity: "Bearish", source: "Reuters" }
    ],
    NVDA: [
      { headline: "Nvidia Blackwell AI chip orders sold out for next three quarters", sentiment: 0.90, polarity: "Bullish", source: "Forbes" },
      { headline: "Competitors announce entry-level alternative processors for edge computing", sentiment: -0.10, polarity: "Neutral", source: "TechRadar" },
      { headline: "Nvidia reports record data center revenue surge in fiscal audit", sentiment: 0.85, polarity: "Bullish", source: "CNBC" }
    ],
    GOOGL: [
      { headline: "Google expands Gemini integration across workspace enterprise plans", sentiment: 0.50, polarity: "Bullish", source: "VentureBeat" },
      { headline: "Search division navigates shifting ad-revenue dynamics amid AI answers", sentiment: -0.05, polarity: "Neutral", source: "AdWeek" },
      { headline: "Google Cloud division hits operating profitability target ahead of plan", sentiment: 0.60, polarity: "Bullish", source: "MarketWatch" }
    ]
  };

  // Simulating WebSocket live ticks
  const timerRef = useRef(null);

  useEffect(() => {
    // Reset price history when symbol changes
    const meta = stockDb[selectedSymbol];
    setCurrentPrice(meta.basePrice);
    setPriceHistory([
      meta.basePrice - 3 * meta.volatility,
      meta.basePrice - 1.5 * meta.volatility,
      meta.basePrice - 2 * meta.volatility,
      meta.basePrice - 0.5 * meta.volatility,
      meta.basePrice
    ]);
    setPriceChange(0);
  }, [selectedSymbol]);

  useEffect(() => {
    // Live tick loop
    timerRef.current = setInterval(() => {
      const meta = stockDb[selectedSymbol];
      const changePct = (Math.random() * 2 - 1) * meta.volatility;
      const changeAmt = parseFloat(changePct.toFixed(2));
      
      setCurrentPrice(prev => {
        const next = parseFloat((prev + changeAmt).toFixed(2));
        setPriceChange(changeAmt);
        setIsUp(changeAmt >= 0);
        setPriceHistory(history => [...history.slice(1), next]);
        return next;
      });
    }, 2500);

    return () => clearInterval(timerRef.current);
  }, [selectedSymbol]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const symbol = searchTerm.toUpperCase();
    if (stockDb[symbol]) {
      setSelectedSymbol(symbol);
      setSearchTerm('');
    } else {
      alert(`Ticker symbol '${symbol}' not in pre-configured simulator dashboard (Choose AAPL, TSLA, NVDA, GOOGL).`);
    }
  };

  // Compute sentiment aggregate
  const newsList = newsDb[selectedSymbol] || [];
  const avgSentiment = newsList.reduce((sum, item) => sum + item.sentiment, 0) / (newsList.length || 1);
  
  let sentimentGauge = "Neutral";
  let gaugeColor = "text-slate-400 border-slate-500/20 bg-slate-500/10";
  if (avgSentiment > 0.2) {
    sentimentGauge = "Bullish";
    gaugeColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  } else if (avgSentiment < -0.2) {
    sentimentGauge = "Bearish";
    gaugeColor = "text-rose-400 border-rose-500/20 bg-rose-500/10";
  }

  return (
    <div className="page-container">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </button>
        <span className="text-xs font-mono text-slate-500">Live WebSocket Tickers & Sentiment NLP</span>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">
          StockVibe <span className="text-violet-400 glow-text-violet">Sentiment Analytics</span>
        </h2>
        <p className="text-slate-400 text-sm font-light mt-1">Live WebSocket asset tracking overlaid with News NLP sentiment analysis engines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Stock Selector & WebSocket Graph */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              {/* Ticker Search */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search Tickers (e.g. NVDA)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-1 px-3 text-xs w-48 uppercase"
                />
                <button type="submit" className="btn-primary py-1 px-3 text-xs flex items-center">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick Browse */}
              <div className="flex gap-1.5 flex-wrap">
                {Object.keys(stockDb).map(sym => (
                  <button
                    key={sym}
                    onClick={() => setSelectedSymbol(sym)}
                    className={`px-3 py-1 rounded font-mono text-xs font-semibold border transition-all ${
                      selectedSymbol === sym ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Ticker Output */}
            <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5 mb-6">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold tracking-wider uppercase">
                  {stockDb[selectedSymbol].name} ({selectedSymbol})
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-extrabold text-white">${currentPrice.toFixed(2)}</span>
                  <span className={`flex items-center text-sm font-semibold font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? <TrendingUp className="w-4 h-4 mr-0.5" /> : <TrendingDown className="w-4 h-4 mr-0.5" />}
                    {isUp ? '+' : ''}{priceChange.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col font-mono text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  WS STREAM ACTIVE
                </span>
                <span className="mt-1">Interval: 2500ms</span>
              </div>
            </div>

            {/* Custom SVG Line Graph */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5">
              <span className="text-xs text-slate-500 font-mono mb-4 block uppercase">Real-Time Streaming Price curve</span>
              
              <div className="h-48 relative flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid background lines */}
                  <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

                  {/* Curve drawing */}
                  {(() => {
                    const min = Math.min(...priceHistory) * 0.999;
                    const max = Math.max(...priceHistory) * 1.001;
                    const range = max - min || 1;
                    
                    let pathD = "";
                    const count = priceHistory.length;
                    
                    const points = priceHistory.map((val, idx) => {
                      const x = (idx / (count - 1)) * 100;
                      const y = 90 - ((val - min) / range) * 80; // Scale into 10% - 90% vertical
                      return { x, y };
                    });

                    pathD = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 1; i < points.length; i++) {
                      pathD += ` L ${points[i].x} ${points[i].y}`;
                    }

                    return (
                      <>
                        <path d={`${pathD} L 100 100 L 0 100 Z`} fill="url(#stockGrad)" opacity="0.12" />
                        <path d={pathD} fill="none" stroke={isUp ? "var(--color-emerald)" : "var(--color-rose)"} strokeWidth="2" style={{ transition: 'stroke 0.3s' }} />
                        {/* Flashing current price dot */}
                        {points.length > 0 && (
                          <circle
                            cx={points[points.length - 1].x}
                            cy={points[points.length - 1].y}
                            r="4.5"
                            fill={isUp ? "var(--color-emerald)" : "var(--color-rose)"}
                            className="animate-pulse"
                          />
                        )}
                      </>
                    );
                  })()}

                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-emerald)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-2 pt-2 border-t border-white/5">
                <span>-15 Ticks</span>
                <span>WebSocket Stream Price History</span>
                <span>Live Tick</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: News Sentiment Classifier (NLP) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass p-6 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-indigo-400" />
              NLP Sentiment Analysis Engine
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              We query financial news feeds for ticker <strong>{selectedSymbol}</strong> and execute linguistic polarity models (TextBlob) to calculate positive/negative scores.
            </p>

            {/* Sentiment Meter */}
            <div className={`p-4 rounded-xl border flex justify-between items-center ${gaugeColor}`}>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500">AGGREGATE SENTIMENT GAUGE</span>
                <h4 className="text-2xl font-extrabold tracking-tight mt-1">{sentimentGauge}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500">POLARITY SCORE</span>
                <p className="text-2xl font-bold font-mono mt-1">{(avgSentiment).toFixed(2)}</p>
              </div>
            </div>

            {/* News List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Linguistic Analysis feed (TextBlob classifier logs)</span>
              
              {newsList.map((article, idx) => (
                <div key={idx} className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2 font-light">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">{article.source}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      article.polarity === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400' :
                      article.polarity === 'Bearish' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-slate-700/20 text-slate-400'
                    }`}>
                      {article.polarity} ({article.sentiment > 0 ? '+' : ''}{article.sentiment.toFixed(2)})
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">"{article.headline}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
