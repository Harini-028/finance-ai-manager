import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <p className="font-display text-8xl font-bold gradient-text">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-ink-500 dark:text-ink-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back home</Link>
          <Link to="/app" className="btn-primary"><Home className="h-4 w-4" /> Dashboard</Link>
        </div>
      </motion.div>
    </div>
  );
}
