import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, Mail } from 'lucide-react';

const recentJoiners = ['SK', 'MB', 'JC', 'RP', 'AL', 'TW'];

export function CTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl gradient-brand p-10 lg:p-16 text-center shadow-glow"
        >
          <div className="absolute inset-0 bg-grid bg-grid-dark opacity-20" />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white mb-5">
              <Sparkles className="h-4 w-4" /> Start your financial journey today
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight text-balance">
              Take control of your money with AI
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              Join 180,000+ people who trust FinPilot AI to track, budget, and grow their wealth smarter.
            </p>

            {/* Social proof row */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {recentJoiners.map((a) => (
                  <div key={a} className="h-8 w-8 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-white text-[10px] font-bold">
                    {a}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/80">
                <span className="font-semibold text-white">+2,400</span> joined this week
              </p>
            </div>

            {/* Email capture */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-xl bg-white/15 backdrop-blur border border-white/30 pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                  />
                </div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 text-sm">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 flex items-center justify-center gap-2 text-white font-semibold"
              >
                <CheckCircle2 className="h-6 w-6" />
                You're on the list! Check your inbox to get started.
              </motion.div>
            )}

            {!submitted && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur border border-white/30 px-6 py-3 font-semibold text-white transition-all hover:bg-white/20 text-sm">
                  Create free account
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur border border-white/30 px-6 py-3 font-semibold text-white transition-all hover:bg-white/20 text-sm">
                  Sign in
                </Link>
              </div>
            )}

            {/* Trust bullets */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-white/70">
              {['No credit card required', 'Bank-grade security', 'Cancel anytime', '30-day guarantee'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white/50" /> {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
