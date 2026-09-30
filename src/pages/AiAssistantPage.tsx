import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Lightbulb, Info, FileText, Target, Wallet, BarChart3, Bot, User as UserIcon, RefreshCw,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { generateInsights, aiScoreLabel, computeSummary } from '../lib/analytics';
import { generateChatReply, suggestedPrompts } from '../lib/aiChat';
import { formatCurrency, cn, currentMonthKey } from '../lib/format';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

const insightIcons: Record<string, typeof TrendingUp> = {
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle2, lightbulb: Lightbulb, info: Info, 'file-text': FileText,
  target: Target, wallet: Wallet, gauge: BarChart3,
};

const insightStyles: Record<string, { border: string; bg: string; icon: string }> = {
  positive: { border: 'border-brand-500/30', bg: 'bg-brand-500/5', icon: 'text-brand-500' },
  warning: { border: 'border-warning-500/30', bg: 'bg-warning-500/5', icon: 'text-warning-500' },
  negative: { border: 'border-error-500/30', bg: 'bg-error-500/5', icon: 'text-error-500' },
  info: { border: 'border-accent-500/30', bg: 'bg-accent-500/5', icon: 'text-accent-500' },
  tip: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', icon: 'text-violet-500' },
};

export default function AiAssistantPage() {
  const { profile } = useAuth();
  const { transactions, budgets, loading } = useDashboardData();
  const currency = profile?.currency ?? 'USD';
  const monthKey = currentMonthKey();

  const insights = useMemo(() => generateInsights(transactions, budgets, monthKey), [transactions, budgets, monthKey]);
  const summary = useMemo(() => computeSummary(transactions, budgets, monthKey), [transactions, budgets, monthKey]);
  const scoreInfo = aiScoreLabel(summary.aiScore);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: "Hi! I'm your FinPilot AI assistant. I've analyzed your financial data and I'm ready to answer questions about your spending, savings, budgets, and more. What would you like to know?" },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const res = await api.post('/ai/chat', { prompt: text });
      if (res.data.success && res.data.data?.reply) {
        setMessages((p) => [...p, { id: `a-${Date.now()}`, role: 'assistant', content: res.data.data.reply }]);
      } else {
        const fallbackReply = generateChatReply(text, { transactions, budgets, profile });
        setMessages((p) => [...p, { id: `a-${Date.now()}`, role: 'assistant', content: fallbackReply }]);
      }
    } catch (e) {
      const fallbackReply = generateChatReply(text, { transactions, budgets, profile });
      setMessages((p) => [...p, { id: `a-${Date.now()}`, role: 'assistant', content: fallbackReply }]);
    } finally {
      setThinking(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">AI Assistant</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Personalized financial insights and an AI chatbot to answer your questions</p>
      </div>

      {/* AI Score banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full gradient-violet opacity-10 blur-2xl" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-ink-100 dark:text-ink-800" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke={scoreInfo.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - summary.aiScore / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-ink-900 dark:text-white">{summary.aiScore}</span>
                <span className="text-[10px] text-ink-400">/ 100</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">AI Financial Score</h3>
              </div>
              <p className="text-sm font-semibold" style={{ color: scoreInfo.color }}>{scoreInfo.label}</p>
              <p className="mt-1 text-xs text-ink-400 max-w-md">Based on savings rate ({summary.savingsRate}%), budget utilization ({summary.budgetUtilization}%), and income consistency.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
            <div className="text-center rounded-xl bg-ink-50 dark:bg-ink-800/50 px-4 py-3">
              <p className="text-xs text-ink-400">Savings</p>
              <p className="font-display font-bold text-brand-600 dark:text-brand-400">{formatCurrency(summary.savings, currency)}</p>
            </div>
            <div className="text-center rounded-xl bg-ink-50 dark:bg-ink-800/50 px-4 py-3">
              <p className="text-xs text-ink-400">Rate</p>
              <p className="font-display font-bold text-ink-900 dark:text-white">{summary.savingsRate}%</p>
            </div>
            <div className="text-center rounded-xl bg-ink-50 dark:bg-ink-800/50 px-4 py-3">
              <p className="text-xs text-ink-400">Budget</p>
              <p className="font-display font-bold text-warning-600 dark:text-warning-400">{summary.budgetUtilization}%</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 50/30/20 Smart AI Budget Rule Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 border-brand-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-brand-500" /> 50/30/20 Smart AI Budget Calculator
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">Automated breakdown based on your monthly income of {formatCurrency(summary.totalIncome || 5000, currency)}</p>
          </div>
          <button
            onClick={() => send(`How can I optimize my monthly budget based on the 50/30/20 rule for an income of ${formatCurrency(summary.totalIncome || 5000, currency)}?`)}
            className="btn-secondary text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Ask AI to Optimize
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Needs (50%)</span>
              <span className="text-xs font-bold text-ink-900 dark:text-white">{formatCurrency((summary.totalIncome || 5000) * 0.5, currency)}</span>
            </div>
            <p className="text-[11px] text-ink-400">Housing, Utilities, Groceries, Transport & Health</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Wants (30%)</span>
              <span className="text-xs font-bold text-ink-900 dark:text-white">{formatCurrency((summary.totalIncome || 5000) * 0.3, currency)}</span>
            </div>
            <p className="text-[11px] text-ink-400">Dining out, Entertainment, Shopping & Travel</p>
          </div>
          <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Savings & Debt (20%)</span>
              <span className="text-xs font-bold text-ink-900 dark:text-white">{formatCurrency((summary.totalIncome || 5000) * 0.2, currency)}</span>
            </div>
            <p className="text-[11px] text-ink-400">Emergency fund, Investments & Extra debt payoff</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Insights panel */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" /> AI Insights
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {insights.map((ins, i) => {
              const Icon = insightIcons[ins.icon] ?? Info;
              const style = insightStyles[ins.type];
              return (
                <motion.div key={ins.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className={cn('rounded-xl border p-4', style.border, style.bg)}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', style.icon)} />
                    <div>
                      <p className="font-semibold text-sm text-ink-900 dark:text-white">{ins.title}</p>
                      <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400 leading-snug">{ins.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Chatbot */}
        <div className="lg:col-span-3">
          <div className="card flex flex-col h-[600px]">
            <div className="flex items-center justify-between p-4 border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-violet text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white dark:ring-ink-900" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 dark:text-white">FinPilot AI Chatbot</p>
                  <p className="text-xs text-brand-500">Online · Ready to help</p>
                </div>
              </div>
              <button onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: "Hi! I'm your FinPilot AI assistant. What would you like to know about your finances?" }])}
                className="p-2 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Reset chat">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', m.role === 'assistant' ? 'gradient-violet text-white' : 'gradient-brand text-white')}>
                    {m.role === 'assistant' ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  </div>
                  <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed', m.role === 'assistant' ? 'bg-ink-100 dark:bg-ink-800 text-ink-800 dark:text-ink-100 rounded-tl-sm' : 'gradient-brand text-white rounded-tr-sm')}>
                    {m.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>)}
                  </div>
                </motion.div>
              ))}
              <AnimatePresence>
                {thinking && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-violet text-white shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-ink-100 dark:bg-ink-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className="h-2 w-2 rounded-full bg-violet-400" />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestedPrompts.map((p) => (
                  <button key={p} onClick={() => send(p)} className="rounded-full bg-ink-100 dark:bg-ink-800 px-3 py-1.5 text-xs font-medium text-ink-600 dark:text-ink-300 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-ink-100 dark:border-ink-800">
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your finances…"
                  className="input-field flex-1" />
                <button type="submit" disabled={!input.trim() || thinking} className="btn-primary px-4 disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
