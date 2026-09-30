import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Users, DollarSign, BarChart3, Globe, Award } from 'lucide-react';

function CountUp({ end, prefix = '', suffix = '', duration = 2000 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, inView]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const stats = [
  {
    icon: DollarSign,
    label: 'Total Tracked',
    value: 2400,
    prefix: '$',
    suffix: 'B+',
    sub: 'across all accounts',
    gradient: 'gradient-brand',
  },
  {
    icon: Users,
    label: 'Active Users',
    value: 180,
    prefix: '',
    suffix: 'K+',
    sub: 'in 42 countries',
    gradient: 'gradient-accent',
  },
  {
    icon: TrendingUp,
    label: 'Avg Savings Boost',
    value: 32,
    prefix: '',
    suffix: '%',
    sub: 'within first 3 months',
    gradient: 'gradient-warm',
  },
  {
    icon: BarChart3,
    label: 'Reduced Overspend',
    value: 47,
    prefix: '',
    suffix: '%',
    sub: 'on dining & shopping',
    gradient: 'gradient-violet',
  },
  {
    icon: Globe,
    label: 'Currencies Supported',
    value: 7,
    prefix: '',
    suffix: '',
    sub: 'USD, EUR, GBP & more',
    gradient: 'gradient-brand',
  },
  {
    icon: Award,
    label: 'User Rating',
    value: 4.9,
    prefix: '',
    suffix: '/5 ★',
    sub: 'from 2,000+ reviews',
    gradient: 'gradient-accent',
  },
];

export function Stats() {
  return (
    <section className="py-16 lg:py-20 border-y border-ink-100 dark:border-ink-800 bg-white/50 dark:bg-ink-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 lg:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group text-center"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.gradient} text-white shadow-soft mb-3 transition-transform group-hover:scale-110`}>
                <s.icon className="h-6 w-6" />
              </div>
              <p className="font-display text-3xl lg:text-4xl font-bold text-ink-900 dark:text-white">
                {s.value % 1 !== 0 ? (
                  <span>{s.prefix}{s.value}{s.suffix}</span>
                ) : (
                  <CountUp end={s.value} prefix={s.prefix} suffix={s.suffix} />
                )}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-ink-700 dark:text-ink-200">{s.label}</p>
              <p className="mt-0.5 text-xs text-ink-400">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
