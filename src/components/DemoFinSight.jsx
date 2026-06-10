import React, { useState } from 'react';
import { ArrowLeft, Upload, TrendingUp, ShieldCheck, DollarSign, Wallet, Award, CheckSquare } from 'lucide-react';

export default function DemoFinSight({ onBack }) {
  // Scenario states
  const [monthlySavings, setMonthlySavings] = useState(300);
  const [interestRate, setInterestRate] = useState(8);
  const [years, setYears] = useState(15);
  
  // Statement parser state
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  
  // Habits state
  const [habits, setHabits] = useState([
    { id: '1', task: 'Logged daily expenses', done: true },
    { id: '2', task: 'Saved $10 cooking at home', done: false },
    { id: '3', task: 'Read one finance insight article', done: false },
    { id: '4', task: 'Avoided impulse purchase today', done: true }
  ]);

  // Compute compound interest
  // Formula: A = P * (((1 + r/n)^(nt) - 1) / (r/n)) where P is monthly deposit, r is annual rate, n=12 months, t=years
  const r = interestRate / 100;
  const n = 12;
  const totalMonths = years * 12;
  const totalDeposits = monthlySavings * totalMonths;
  
  const compoundResult = monthlySavings * ((Math.pow(1 + r/n, totalMonths) - 1) / (r/n)) * (1 + r/n);
  const totalInterest = Math.max(0, compoundResult - totalDeposits);

  const handleHabitToggle = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const handleMockUpload = (e) => {
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      setParsedData({
        fileName: e.target.files[0]?.name || 'statement_june_2026.pdf',
        totalExpenses: 2840,
        breakdown: [
          { category: 'Rent & Housing', amount: 1400, pct: 49, color: 'var(--color-indigo)' },
          { category: 'Food & Dining', amount: 560, pct: 20, color: 'var(--color-violet)' },
          { category: 'Entertainment', amount: 380, pct: 13, color: 'var(--color-rose)' },
          { category: 'Transport', amount: 200, pct: 7, color: 'var(--color-cyan)' },
          { category: 'Miscellaneous', amount: 300, pct: 11, color: 'var(--color-amber)' }
        ],
        leakages: [
          'High streaming service overlapping subscriptions (Rent & Dining leakage: $45/mo).',
          'Dining expenditures exceed average bracket for single occupants by 15%.'
        ]
      });
    }, 1500);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </button>
        <span className="text-xs font-mono text-slate-500">Hackonomics hackathon submission</span>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-white">
          FinSight <span className="text-violet-400 glow-text-violet">Financial Sandbox</span>
        </h2>
        <p className="text-slate-400 text-sm font-light mt-1">Interactive personal finance analysis and long-term interest modeling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Statement Parser & Budget Leakage */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Bank Statement Upload Simulator */}
          <div className="glass p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Automated Statement Parsing API
            </h3>
            
            <p className="text-xs text-slate-400 mb-6 font-light">
              Upload a bank statement in PDF format. Our ingestion pipeline simulates parsing transaction ledgers to categorize budgets.
            </p>

            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/50 hover:bg-white/5 transition-all relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleMockUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 mx-auto text-slate-500 mb-2 animate-bounce" />
              <p className="text-sm font-medium text-white">Drag & drop your PDF statement here</p>
              <p className="text-xs text-slate-500 mt-1">Accepts standard banking export summaries</p>
            </div>

            {isParsing && (
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-indigo-400 font-mono">
                <TrendingUp className="w-4 h-4 animate-spin" /> Ingesting PDF ledger and categorizing transactions...
              </div>
            )}

            {parsedData && (
              <div className="mt-6 flex flex-col gap-4 animate-slideIn">
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-slate-400">File Ingested: <strong>{parsedData.fileName}</strong></span>
                  <span className="text-rose-400 font-bold">Total Expenses: ${parsedData.totalExpenses}</span>
                </div>

                {/* Bar Graph Breakdown */}
                <div className="flex flex-col gap-2">
                  {parsedData.breakdown.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">{item.category}</span>
                        <span className="text-slate-400">${item.amount} ({item.pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Leakages panel */}
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-rose-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Detected Budget Leakages & Overlapping
                  </h4>
                  <ul className="text-xs text-slate-300 list-disc list-inside flex flex-col gap-1 font-light">
                    {parsedData.leakages.map((leak, idx) => (
                      <li key={idx}>{leak}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Micro Savings Habits */}
          <div className="glass p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              Hackonomics Savings Micro-Habit Tracker
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-light">
              Toggle habits checklist. Compounding rewards are unlocked dynamically based on completion streak.
            </p>

            <div className="flex flex-col gap-2">
              {habits.map(habit => (
                <div
                  key={habit.id}
                  onClick={() => handleHabitToggle(habit.id)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${
                    habit.done ? 'bg-indigo-500/15 border-indigo-500/30 text-white' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={habit.done}
                    onChange={() => {}}
                    className="cursor-pointer accent-indigo-500"
                  />
                  <span className="text-xs font-medium">{habit.task}</span>
                </div>
              ))}
            </div>

            {/* Streak Multiplier */}
            <div className="mt-4 bg-white/5 p-3 rounded-lg flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Current Interest Boost:</span>
              <span className="text-emerald-400 font-bold">+{habits.filter(h => h.done).length * 0.25}% APR equivalent</span>
            </div>
          </div>
        </div>

        {/* Right Side: Compound Interest Slider Simulation */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass p-6 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              Long-Term Investment & Compound Scenario Simulator
            </h3>

            {/* Sliders */}
            <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Monthly Contribution ($)</span>
                  <span className="text-white font-bold">${monthlySavings}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Annual Return Rate (%)</span>
                  <span className="text-white font-bold">{interestRate}% APY</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Investment Horizon (Years)</span>
                  <span className="text-white font-bold">{years} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Compound Visual Output */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">TOTAL CONTRIBUTED</span>
                <span className="text-2xl font-bold text-white mt-1">${totalDeposits.toLocaleString()}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-mono">COMPOUND INTEREST INTEREST</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1">${Math.round(totalInterest).toLocaleString()}</span>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-5 rounded-xl border border-indigo-500/20 flex flex-col justify-between items-center text-center">
                <span className="text-xs text-slate-400 font-mono">ESTIMATED TOTAL BALANCE</span>
                <span className="text-4xl font-extrabold text-white mt-2 glow-text-violet">
                  ${Math.round(compoundResult).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1">Growth factor: {(compoundResult / totalDeposits).toFixed(2)}x principal</span>
              </div>
            </div>

            {/* Simulated Chart using custom SVG */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col">
              <span className="text-xs text-slate-400 font-mono mb-4 uppercase tracking-wider">Compound Growth Curve (Projected)</span>
              
              <div className="h-40 relative flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  
                  {/* Compound Curve */}
                  {(() => {
                    let pathData = "M 0 100";
                    const pointsCount = 10;
                    for (let i = 1; i <= pointsCount; i++) {
                      const yr = (years / pointsCount) * i;
                      const months = yr * 12;
                      const val = monthlySavings * ((Math.pow(1 + r/n, months) - 1) / (r/n)) * (1 + r/n);
                      const maxVal = compoundResult;
                      const x = (i / pointsCount) * 100;
                      const y = 100 - (val / maxVal) * 90; // scale to fit 90% height
                      pathData += ` L ${x} ${y}`;
                    }
                    return (
                      <>
                        <path d={`${pathData} L 100 100 Z`} fill="url(#chartGrad)" opacity="0.15" />
                        <path d={pathData} fill="none" stroke="var(--color-violet)" strokeWidth="2" />
                      </>
                    );
                  })()}
                  
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-violet)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 border-t border-white/5 pt-2">
                <span>Start</span>
                <span>{Math.round(years / 2)} Yr</span>
                <span>{years} Yrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
