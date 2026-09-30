import { useState } from 'react';
import { Logo } from '../ui/Logo';
import { Twitter, Github, Linkedin, Mail, Youtube, Instagram } from 'lucide-react';

const columns = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'AI Insights', 'Reports', 'Security', 'Integrations'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Press', 'Partners', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Help Center', 'Documentation', 'Community', 'API Docs', 'Status', 'Changelog'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Licenses'],
  },
];

const socials = [
  { Icon: Twitter, label: 'Twitter' },
  { Icon: Github, label: 'GitHub' },
  { Icon: Linkedin, label: 'LinkedIn' },
  { Icon: Youtube, label: 'YouTube' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Mail, label: 'Email' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="border-t border-ink-100 dark:border-ink-800 bg-white/50 dark:bg-ink-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-400 max-w-xs leading-relaxed">
              Your AI-powered personal finance copilot. Track spending, manage budgets, and grow your wealth with intelligent insights.
            </p>

            {/* Newsletter */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-ink-600 dark:text-ink-300 mb-2 uppercase tracking-wide">Stay updated</p>
              {!subscribed ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 min-w-0 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-xs text-ink-900 dark:text-white placeholder-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                  <button type="submit" className="btn-primary text-xs px-4 py-2 shrink-0">
                    Subscribe
                  </button>
                </form>
              ) : (
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">✓ You're subscribed! Thanks.</p>
              )}
            </div>

            {/* Social icons */}
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700 text-ink-400 hover:text-white hover:gradient-brand hover:border-transparent transition-all"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* App store badges */}
            <div className="mt-5 flex gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 px-3.5 py-2 cursor-pointer hover:border-brand-400 transition-colors">
                <span className="text-lg">🍎</span>
                <div>
                  <p className="text-[9px] text-ink-400 leading-none">Download on the</p>
                  <p className="text-xs font-semibold text-ink-800 dark:text-white leading-tight">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 px-3.5 py-2 cursor-pointer hover:border-brand-400 transition-colors">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="text-[9px] text-ink-400 leading-none">Get it on</p>
                  <p className="text-xs font-semibold text-ink-800 dark:text-white leading-tight">Google Play</p>
                </div>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm text-ink-900 dark:text-white mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-ink-500 dark:text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-ink-100 dark:border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ink-400">© 2026 FinPilot AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              All systems operational
            </div>
            <span>·</span>
            <span>Built with ❤️ for smart finances</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
