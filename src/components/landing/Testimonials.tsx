import { motion } from 'framer-motion';
import { Star, Quote, ThumbsUp } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer',
    company: 'Figma',
    text: 'FinPilot AI changed how I think about money. The AI insights caught my overspending on dining out before it became a problem. My savings rate jumped from 8% to 24%.',
    rating: 5,
    highlight: true,
  },
  {
    name: 'Marcus Johnson',
    role: 'Software Engineer',
    company: 'Stripe',
    text: 'The budget alerts are a game-changer. I finally have real-time visibility into where my money goes. The reports export feature makes tax season completely painless.',
    rating: 5,
    highlight: false,
  },
  {
    name: 'Priya Patel',
    role: 'Marketing Lead',
    company: 'HubSpot',
    text: "I tried Mint, YNAB, and Rocket Money. FinPilot AI is the only one that actually makes finance feel effortless. The AI chatbot is surprisingly insightful and personalized.",
    rating: 5,
    highlight: false,
  },
  {
    name: 'David Kim',
    role: 'Startup Founder',
    company: 'YC Alum',
    text: 'As someone with irregular income, the monthly comparison charts help me plan ahead. The AI score gives me a quick financial health check without digging through numbers.',
    rating: 5,
    highlight: false,
  },
  {
    name: 'Amara Osei',
    role: 'Freelance Consultant',
    company: 'Self-employed',
    text: 'The recurring transaction tracker alone saved me from missing 3 subscriptions I forgot about. Now I run my entire freelance finances through FinPilot. Absolutely love it.',
    rating: 5,
    highlight: false,
  },
  {
    name: 'Lena Müller',
    role: 'Financial Analyst',
    company: 'Deutsche Bank',
    text: 'Even as a finance professional, FinPilot AI gives me a perspective on my personal spending I never had. The analytics are genuinely impressive — clean, fast, and insightful.',
    rating: 5,
    highlight: false,
  },
  {
    name: 'Raj Sharma',
    role: 'Medical Doctor',
    company: 'NHS',
    text: "I have zero time for complex finance tools. FinPilot makes it simple — I log a transaction in 5 seconds and the AI handles the rest. My emergency fund goal is 80% complete!",
    rating: 5,
    highlight: false,
  },
  {
    name: 'Emily Torres',
    role: 'Graduate Student',
    company: 'MIT',
    text: 'As a student on a tight budget, the Free plan is perfect. I track every coffee and grocery. The AI spotted I was spending 30% more than my classmates on food — real eye-opener.',
    rating: 5,
    highlight: false,
  },
];

const gradients = ['gradient-brand', 'gradient-accent', 'gradient-warm', 'gradient-violet'];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <span className="badge bg-warning-500/10 text-warning-600 dark:text-warning-400 mb-4">Loved by thousands</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white tracking-tight text-balance">
            Don't just take our word for it
          </h2>
        </motion.div>

        {/* Overall rating bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-14 glass rounded-2xl p-5 max-w-lg mx-auto"
        >
          <div className="text-center">
            <p className="font-display text-5xl font-bold text-ink-900 dark:text-white">4.9</p>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-warning-400 text-warning-400" />
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-1">out of 5.0</p>
          </div>
          <div className="h-px sm:h-12 sm:w-px w-full bg-ink-100 dark:bg-ink-800" />
          <div className="space-y-1.5 w-full max-w-[200px]">
            {[5, 4, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="text-xs text-ink-400 w-4">{s}★</span>
                <div className="flex-1 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                  <div
                    className="h-full gradient-brand rounded-full"
                    style={{ width: s === 5 ? '88%' : s === 4 ? '9%' : '3%' }}
                  />
                </div>
                <span className="text-xs text-ink-400 w-8">{s === 5 ? '88%' : s === 4 ? '9%' : '3%'}</span>
              </div>
            ))}
          </div>
          <div className="h-px sm:h-12 sm:w-px w-full bg-ink-100 dark:bg-ink-800" />
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">2,400+</p>
            <p className="text-xs text-ink-400">verified reviews</p>
            <div className="flex items-center gap-1 mt-1 justify-center text-brand-500 text-xs font-medium">
              <ThumbsUp className="h-3.5 w-3.5" /> 98% recommend
            </div>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`card p-5 relative overflow-hidden ${t.highlight ? 'ring-2 ring-brand-500/40 shadow-glow' : ''}`}
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-brand-500/10" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
                ))}
              </div>
              <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-2.5 mt-auto">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${gradients[i % 4]} text-white text-xs font-bold shrink-0`}>
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-ink-400">{t.role} · {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
