import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Progress({ className, value, ...props }: ProgressPrimitive.ProgressProps) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/60 border border-border/10', className)}
      {...props}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value || 0}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-lg shadow-primary/20"
      />
    </ProgressPrimitive.Root>
  );
}
