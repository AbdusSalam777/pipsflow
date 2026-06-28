import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/10',
        outline: 'border border-border bg-transparent hover:bg-accent/40 hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent/40 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        profit: 'bg-profit/15 text-profit hover:bg-profit/25 border border-profit/20',
        loss: 'bg-loss/15 text-loss hover:bg-loss/25 border border-loss/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  if (asChild) {
    const Comp = Slot;
    return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ type: "spring", stiffness: 450, damping: 15 }}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props as any}
    />
  );
}
