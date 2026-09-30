import { motion } from 'framer-motion';

const integrations = [
  { name: 'PayPal', emoji: '🔵', desc: 'Payment tracking', available: true },
  { name: 'Stripe', emoji: '💳', desc: 'Revenue analytics', available: true },
  { name: 'Google Pay', emoji: '🟢', desc: 'Expense sync', available: true },
  { name: 'Apple Pay', emoji: '🍎', desc: 'Wallet integration', available: true },
  { name: 'Coinbase', emoji: '🪙', desc: 'Crypto portfolio', available: true },
  { name: 'Binance', emoji: '🟡', desc: 'DeFi tracking', available: false },
  { name: 'Chase', emoji: '🏦', desc: 'Bank sync', available: false },
  { name: 'Wise', emoji: '🌍', desc: 'Multi-currency', available: false },
  { name: 'Venmo', emoji: '💸', desc: 'P2P payments', available: false },
  { name: 'Plaid', emoji: '🔗', desc: 'Bank connections', available: false },
  { name: 'QuickBooks', emoji: '📒', desc: 'Accounting sync', available: false },
  { name: 'Xero', emoji: '✕', desc: 'Business finance', available: false },
];

export function Integrations() {
  return (
    <section id="integrations" className="py-20 lg:py-28 bg-white/50 dark:bg-ink-900/30 border-y border-ink-100 dark:border-ink-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="badge bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-4">Connect everything</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white tracking-tight text-balance">
            Works with your favorite <span className="gradient-text">apps & services</span>
          </h2>
          <p className="mt-4 text-lg text-ink-500 dark:text-ink-400">
            Connect your payment platforms, banks, and crypto wallets — or use FinPilot AI standalone with manual entry.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {integrations.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group card p-4 cursor-default relative overflow-hidden"
            >
              {!item.available && (
                <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold bg-ink-100 dark:bg-ink-800 text-ink-400 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              )}
              <div className="text-3xl mb-3">{item.emoji}</div>
              <p className="font-display font-bold text-sm text-ink-900 dark:text-white">{item.name}</p>
              <p className="text-xs text-ink-400 mt-0.5">{item.desc}</p>
              {item.available && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">Available</span>
                </div>
              )}
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-brand-500/5 to-transparent rounded-2xl" />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-ink-400 mt-10"
        >
          Don't see your app? <a href="#faq" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">Request an integration →</a>
        </motion.p>
      </div>
    </section>
  );
}
