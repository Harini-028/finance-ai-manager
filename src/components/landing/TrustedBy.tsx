import { motion } from 'framer-motion';

const companies = [
  { name: 'Stripe', emoji: '💳' },
  { name: 'Shopify', emoji: '🛒' },
  { name: 'Airbnb', emoji: '🏠' },
  { name: 'Notion', emoji: '📝' },
  { name: 'Figma', emoji: '🎨' },
  { name: 'Vercel', emoji: '▲' },
  { name: 'Linear', emoji: '⚡' },
  { name: 'Loom', emoji: '🎬' },
  { name: 'Intercom', emoji: '💬' },
  { name: 'Zapier', emoji: '🔗' },
  { name: 'Airtable', emoji: '📊' },
  { name: 'Notion', emoji: '🚀' },
];

const LogoCard = ({ name, emoji }: { name: string; emoji: string }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900/80 px-5 py-3 shadow-soft shrink-0 mx-3">
    <span className="text-xl">{emoji}</span>
    <span className="font-display font-semibold text-sm text-ink-600 dark:text-ink-300 whitespace-nowrap">{name}</span>
  </div>
);

export function TrustedBy() {
  const doubled = [...companies, ...companies];

  return (
    <section className="py-12 lg:py-16 overflow-hidden border-y border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium text-ink-400 dark:text-ink-500 uppercase tracking-widest"
        >
          Trusted by teams at
        </motion.p>
      </div>

      <div className="relative flex">
        {/* Gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-ink-50 dark:from-ink-950 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-ink-50 dark:from-ink-950 to-transparent pointer-events-none" />

        <motion.div
          className="flex"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {doubled.map((c, i) => (
            <LogoCard key={i} name={c.name} emoji={c.emoji} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
