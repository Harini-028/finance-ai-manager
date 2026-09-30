import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

type Faq = { q: string; a: string; cat: string };

const faqs: Faq[] = [
  // General
  { cat: 'General', q: 'Is FinPilot AI free to use?', a: 'Yes! Our Free plan includes transaction tracking, basic budgets, and AI insights at no cost, forever. Pro and Business plans unlock unlimited transactions, advanced reports, and priority AI features.' },
  { cat: 'General', q: 'Do I need to connect my bank account?', a: 'No. FinPilot AI works entirely with manually-entered transactions. There is no bank connection required, keeping your accounts completely private and secure.' },
  { cat: 'General', q: 'What currencies and languages are supported?', a: 'We support 7 major currencies (USD, EUR, GBP, INR, JPY, AUD, CAD) and 6 languages (English, Spanish, French, German, Hindi, Japanese). Switch anytime from Settings.' },
  // Security
  { cat: 'Security', q: 'Is my financial data secure?', a: 'Absolutely. We use AES-256 encryption and row-level security on every account. Your data is completely isolated — only you can access it. We never sell or share your information with third parties.' },
  { cat: 'Security', q: 'What happens to my data if I cancel?', a: 'Your data remains accessible for 90 days after cancellation. You can export everything to CSV or PDF at any time. After 90 days, all data is permanently deleted from our servers.' },
  // AI
  { cat: 'AI', q: 'How does the AI financial score work?', a: 'Our AI analyzes your savings rate, budget utilization, income consistency, debt ratio, and spending trends to calculate a 0–100 score. It updates in real time as you log transactions and improves as more data is available.' },
  { cat: 'AI', q: 'How accurate is the AI chatbot?', a: 'The AI assistant is trained on financial best practices and uses your personal transaction data to give contextual, personalized answers. It improves the more you use the app. Complex financial decisions should always involve a certified advisor.' },
  // Billing
  { cat: 'Billing', q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can change your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period. We offer a 30-day money-back guarantee, no questions asked.' },
  { cat: 'Billing', q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex), PayPal, and Google Pay. All payments are processed securely via Stripe.' },
  { cat: 'Billing', q: 'Can I export my data?', a: 'Yes. You can export any report or your full transaction history to CSV or PDF with a single click, on any plan. Your data is always yours — export it anytime, no questions asked.' },
];

const categories = ['All', 'General', 'Security', 'AI', 'Billing'];

const catColors: Record<string, string> = {
  General: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  Security: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
  AI: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Billing: 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
};

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? faqs : faqs.filter(f => f.cat === activeCategory);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white/50 dark:bg-ink-900/30 border-y border-ink-100 dark:border-ink-800">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="badge bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-4">Got questions?</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-ink-500 dark:text-ink-400">
            Everything you need to know about FinPilot AI.
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpen(null); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'gradient-brand text-white shadow-soft'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((f, i) => (
            <motion.div
              key={`${activeCategory}-${i}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`badge text-xs shrink-0 ${catColors[f.cat] || ''}`}>{f.cat}</span>
                  <span className="font-display font-semibold text-ink-900 dark:text-white">{f.q}</span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-ink-400 shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-ink-400 mt-8">
          Still have questions?{' '}
          <a href="mailto:hello@finpilot.ai" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Chat with our team →
          </a>
        </p>
      </div>
    </section>
  );
}
