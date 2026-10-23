import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Calculator,
  ChevronDown, ChevronUp, Lightbulb,
  ShieldCheck, User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import api from '../services/api';
import { formatCurrency } from '../lib/format';

type CalculationData = {
  formula?: string;
  breakdown?: Array<{ label: string; value: string }>;
  assumptions?: string[];
  recommendation?: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  calculation?: CalculationData;
  timestamp: string;
};

const suggestedQuestions = [
  'How much can I save this month?',
  'Which category has the highest spending?',
  'How can I save ₹2,000 next month?',
  'Can I afford a ₹10,000 purchase based on my current budget?',
  'What is my monthly cashflow surplus?',
  'Analyze my spending discipline this month',
];

export default function AiCoachPage() {
  const { profile } = useAuth();
  const { transactions } = useDashboardData();
  const currency = profile?.currency ?? 'INR';

  // Calculate quick metrics for financial snapshot banner
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') {
        expense += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    });

    const surplus = income - expense;
    const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : 0;
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    return {
      income,
      expense,
      surplus,
      savingsRate,
      topCategory: topCat ? { name: topCat[0], amount: topCat[1] } : null,
    };
  }, [transactions]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-coach',
      role: 'assistant',
      content: `Hello ${profile?.full_name || 'there'}! I am your **FinPilot AI Financial Coach**.\n\nI have securely analyzed your active transactions, budgets, and savings goals. Ask me questions about your affordability, savings capacity, category expenses, or goal planning, and I will show you the exact math and assumptions behind every answer!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [expandedMath, setExpandedMath] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  const toggleMath = (msgId: string) => {
    setExpandedMath((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || thinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setThinking(true);

    try {
      const res = await api.post('/ai/coach', { prompt: text });
      if (res.data?.success && res.data.data) {
        const assistantMsg: ChatMessage = {
          id: `coach-${Date.now()}`,
          role: 'assistant',
          content: res.data.data.reply || "I've analyzed your financial situation.",
          calculation: res.data.data.calculation,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (res.data.data.calculation?.formula) {
          // Auto-expand the calculation for visibility
          setExpandedMath((prev) => ({ ...prev, [assistantMsg.id]: true }));
        }
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err: any) {
      console.warn('Backend coach call failed, using client fallback:', err);
      // Client-side rule-based fallback based on authentic user transactions
      const reply = generateLocalCoachReply(text, metrics);
      const assistantMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        role: 'assistant',
        content: reply.content,
        calculation: reply.calculation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setThinking(false);
    }
  };

  // Local rule-based math fallback if server is unreachable
  const generateLocalCoachReply = (query: string, m: typeof metrics) => {
    const q = query.toLowerCase();
    if (q.includes('save') && q.includes('how much')) {
      return {
        content: `Based on your recorded transactions, you have a monthly income of ${formatCurrency(m.income, currency)} and expenses of ${formatCurrency(m.expense, currency)}. Your current unallocated surplus is **${formatCurrency(m.surplus, currency)}** (${m.savingsRate}% savings rate).`,
        calculation: {
          formula: 'Monthly Savings Capacity = Total Income - Total Expenses',
          breakdown: [
            { label: 'Recorded Income', value: formatCurrency(m.income, currency) },
            { label: 'Recorded Expenses', value: formatCurrency(m.expense, currency) },
            { label: 'Net Monthly Surplus', value: formatCurrency(m.surplus, currency) },
          ],
          assumptions: ['Current month expenditure rate remains constant.'],
          recommendation: m.surplus > 0 ? 'Automate savings deposits on salary day to lock in your surplus.' : 'Cut discretionary spending to eliminate monthly deficit.',
        },
      };
    }

    if (q.includes('highest') || q.includes('category')) {
      const cat = m.topCategory?.name || 'General Expenses';
      const amt = m.topCategory?.amount || 0;
      const pct = m.expense > 0 ? Math.round((amt / m.expense) * 100) : 0;
      return {
        content: `Your highest recorded spending category is **${cat}** at **${formatCurrency(amt, currency)}**, which represents **${pct}%** of your total expenses (${formatCurrency(m.expense, currency)}).`,
        calculation: {
          formula: 'Category Share % = (Category Spend ÷ Total Expenses) × 100',
          breakdown: [
            { label: 'Top Category', value: cat },
            { label: 'Amount Spent', value: formatCurrency(amt, currency) },
            { label: 'Total Outflow', value: formatCurrency(m.expense, currency) },
            { label: 'Share', value: `${pct}%` },
          ],
          assumptions: ['Derived strictly from user-entered expense records.'],
          recommendation: pct > 35 ? `Consider capping ${cat} spending to prevent it from dominating your cashflow.` : 'Healthy category distribution.',
        },
      };
    }

    return {
      content: `Here is your current financial analysis:\n• Monthly Income: ${formatCurrency(m.income, currency)}\n• Monthly Expenses: ${formatCurrency(m.expense, currency)}\n• Net Monthly Surplus: ${formatCurrency(m.surplus, currency)} (${m.savingsRate}% savings rate)\n• Highest Category: ${m.topCategory ? `${m.topCategory.name} (${formatCurrency(m.topCategory.amount, currency)})` : 'None'}`,
      calculation: {
        formula: 'Net Surplus = Monthly Income - Monthly Expenses',
        breakdown: [
          { label: 'Income', value: formatCurrency(m.income, currency) },
          { label: 'Expenses', value: formatCurrency(m.expense, currency) },
          { label: 'Surplus', value: formatCurrency(m.surplus, currency) },
        ],
        assumptions: ['Based on current transaction data.'],
        recommendation: 'Target a 20%+ savings rate for optimal financial health.',
      },
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-2 rounded-xl gradient-brand text-white shadow-soft">
              <Bot className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
              AI Financial Coach
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Intelligent Q&A powered by your actual financial records with full calculation transparency
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>Zero Data Leakage · Private to Your Account</span>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Recorded Income</p>
          <p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">{formatCurrency(metrics.income, currency)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Active cashflow</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Recorded Expenses</p>
          <p className="mt-1 text-xl font-bold text-error-600 dark:text-error-400">{formatCurrency(metrics.expense, currency)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Discretionary + fixed</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Net Monthly Surplus</p>
          <p className={`mt-1 text-xl font-bold ${metrics.surplus >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-error-600 dark:text-error-400'}`}>
            {formatCurrency(metrics.surplus, currency)}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">{metrics.savingsRate}% savings rate</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Highest Spend Area</p>
          <p className="mt-1 text-xl font-bold text-ink-900 dark:text-white truncate">
            {metrics.topCategory ? metrics.topCategory.name : 'None'}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">
            {metrics.topCategory ? formatCurrency(metrics.topCategory.amount, currency) : 'No expenses'}
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="card border border-ink-100 dark:border-ink-800 flex flex-col h-[640px] shadow-soft overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-ink-850 border border-ink-100 dark:border-ink-800 text-ink-900 dark:text-ink-100 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line font-normal">{msg.content}</div>
                    <div className={`text-[11px] mt-2 text-right ${msg.role === 'user' ? 'text-brand-100' : 'text-ink-400'}`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Calculations & Assumptions Accordion for AI Responses */}
                  {msg.role === 'assistant' && msg.calculation && (
                    <div className="border border-brand-500/20 bg-brand-500/5 dark:bg-brand-950/20 rounded-xl overflow-hidden text-xs">
                      <button
                        onClick={() => toggleMath(msg.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-brand-700 dark:text-brand-300 font-semibold hover:bg-brand-500/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          <span>Calculations & Underlying Assumptions</span>
                        </span>
                        {expandedMath[msg.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      {expandedMath[msg.id] && (
                        <div className="p-3.5 pt-1 space-y-3 border-t border-brand-500/15">
                          {msg.calculation.formula && (
                            <div>
                              <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Mathematical Formula</p>
                              <code className="block p-2 rounded-lg bg-ink-100 dark:bg-ink-900 text-brand-600 dark:text-brand-400 font-mono text-[11px]">
                                {msg.calculation.formula}
                              </code>
                            </div>
                          )}

                          {msg.calculation.breakdown && msg.calculation.breakdown.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Numerical Inputs</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.calculation.breakdown.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white dark:bg-ink-900 px-2.5 py-1.5 rounded border border-ink-100 dark:border-ink-800">
                                    <span className="text-ink-500 dark:text-ink-400">{item.label}:</span>
                                    <span className="font-semibold text-ink-800 dark:text-white">{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {msg.calculation.assumptions && msg.calculation.assumptions.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Model Assumptions</p>
                              <ul className="space-y-1 text-ink-600 dark:text-ink-300">
                                {msg.calculation.assumptions.map((assump, aIdx) => (
                                  <li key={aIdx} className="flex items-start gap-1.5">
                                    <span className="text-brand-500 mt-0.5">•</span>
                                    <span>{assump}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.calculation.recommendation && (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-medium">
                              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{msg.calculation.recommendation}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="h-9 w-9 rounded-xl bg-ink-200 dark:bg-ink-700 flex items-center justify-center text-ink-700 dark:text-ink-200 shrink-0 mt-1">
                    <UserIcon className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            ))}

            {thinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center text-ink-400 text-sm">
                <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white shrink-0">
                  <Bot className="h-5 w-5 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-ink-850 px-4 py-2.5 rounded-2xl border border-ink-100 dark:border-ink-800 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2 text-xs text-ink-400">Computing calculations from your records...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Chips Bar */}
        <div className="px-4 py-2 border-t border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/50 overflow-x-auto flex gap-2 no-scrollbar">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={thinking}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-ink-200 dark:border-ink-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 transition-colors shadow-2xs disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about spending, savings, budget affordability (e.g. 'Can I afford ₹10,000?')..."
              className="input-field text-sm flex-1"
              disabled={thinking}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="btn-primary px-4 py-2.5 text-sm shrink-0 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Coach</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
