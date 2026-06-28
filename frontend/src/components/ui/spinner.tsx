import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-8 w-8 animate-spin text-primary', className)} />;
}

export function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
      <motion.div
        animate={{
          scale: [1, 1.2, 1, 0.8, 1],
          rotate: [0, 180, 360],
          borderRadius: ["25%", "50%", "25%"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex h-12 w-12 items-center justify-center bg-primary/10 rounded-xl border border-primary/30"
      >
        <Spinner className="h-6 w-6" />
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
      >
        Analyzing journal...
      </motion.p>
    </div>
  );
}

export function StatCard({ title, value, subtitle, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = trend === 'up' ? 'text-profit' : trend === 'down' ? 'text-loss' : 'text-foreground';
  
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="rounded-xl glass glow-card p-4 relative overflow-hidden flex flex-col justify-between"
    >
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        {trend === 'up' && (
          <span className="p-1 rounded-md bg-profit/10 text-profit">
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
        )}
        {trend === 'down' && (
          <span className="p-1 rounded-md bg-loss/10 text-loss">
            <TrendingDown className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className={cn('text-2xl font-extrabold tracking-tight', trendColor)}>{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      
      {/* Background soft lighting glow */}
      <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-primary/5 blur-xl pointer-events-none" />
    </motion.div>
  );
}
